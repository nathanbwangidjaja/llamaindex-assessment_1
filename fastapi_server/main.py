import os
import json
import shutil
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx

load_dotenv()

# ============================== ENV / CONSTANTS ==============================
PORT = int(os.getenv("PORT", "4000"))

# Use the official default if not provided
LLAMA_BASE = os.getenv("LLAMACLOUD_BASE_URL", "https://api.cloud.llamaindex.ai")
LLAMA_KEY  = os.getenv("LLAMACLOUD_API_KEY")
LLAMA_ORG_ID = os.getenv("LLAMA_ORG_ID")
LLAMA_PROJECT_ID = os.getenv("LLAMA_PROJECT_ID")

SCHEMA_PATH = Path(os.getenv("EXTRACTION_SCHEMA_PATH", "schema/insurance.schema.json"))

if not LLAMA_KEY:
    print("⚠️  Missing LLAMACLOUD_API_KEY (set it in your .env)")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MIMES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
}

# ================================ APP SETUP =================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================ SCHEMA LOADING =================================
extraction_schema: Optional[dict] = None
try:
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        extraction_schema = json.load(f)
except Exception as e:
    print(f"⚠️  Failed to load schema from {SCHEMA_PATH}: {e}")

# ========================= LlamaCloud helper functions =======================

class LlamaCloudError(Exception):
    pass


def _auth_headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {LLAMA_KEY}",
        "Accept": "application/json",
    }


# ---------- LlamaParse (best-effort; not strictly required for extraction) ---
async def _llama_parse_upload(client: httpx.AsyncClient, file_path: Path, mime: str) -> Dict[str, Any]:
    """
    Start a LlamaParse job. Returns payload that should include a job_id.
    """
    url = f"{LLAMA_BASE.rstrip('/')}/api/v1/parsing/upload"
    data: Dict[str, str] = {}
    if LLAMA_ORG_ID:
        data["organization_id"] = LLAMA_ORG_ID
    if LLAMA_PROJECT_ID:
        data["project_id"] = LLAMA_PROJECT_ID

    files = {"file": (file_path.name, file_path.open("rb"), mime)}
    r = await client.post(url, headers=_auth_headers(), data=data, files=files, timeout=60)
    if r.status_code >= 400:
        raise LlamaCloudError(f"LlamaParse failed: {r.status_code} {r.text}")
    return r.json()


async def _llama_parse_poll(client: httpx.AsyncClient, job_id: str, *, timeout_s: int = 120, poll_every_s: float = 1.5) -> Dict[str, Any]:
    """
    Polls a LlamaParse job until completion.
    """
    url = f"{LLAMA_BASE.rstrip('/')}/api/v1/parsing/job/{job_id}"
    deadline = asyncio.get_event_loop().time() + timeout_s
    last_status = None

    while True:
        r = await client.get(url, headers=_auth_headers(), timeout=30)
        if r.status_code >= 400:
            raise LlamaCloudError(f"Poll LlamaParse failed: {r.status_code} {r.text}")
        payload = r.json()
        status = (payload.get("status") or "").upper()
        if status != last_status:
            last_status = status
        if status in ("SUCCESS", "COMPLETED", "DONE"):
            return payload
        if status in ("ERROR", "FAILED"):
            raise LlamaCloudError(f"LlamaParse job error: {json.dumps(payload)[:400]}")
        if asyncio.get_event_loop().time() > deadline:
            raise LlamaCloudError("Timed out waiting for LlamaParse job to complete")
        await asyncio.sleep(poll_every_s)


# --------------------------- Files & Stateless Extraction ---------------------
async def _files_upload(client: httpx.AsyncClient, file_path: Path, mime: str) -> str:
    """
    Upload a file to LlamaCloud to get a file_id for extraction.
    """
    url = f"{LLAMA_BASE.rstrip('/')}/api/v1/files"
    files = {"upload_file": (file_path.name, file_path.open("rb"), mime)}
    r = await client.post(url, headers=_auth_headers(), files=files, timeout=60)
    if r.status_code >= 400:
        raise LlamaCloudError(f"Files upload failed: {r.status_code} {r.text}")
    data = r.json()
    file_id = data.get("id") or (data.get("file") or {}).get("id")
    if not file_id:
        raise LlamaCloudError(f"Could not find file_id in response: {data}")
    return file_id


# --- add these helpers (near your other helpers) ---
async def _extraction_poll(client: httpx.AsyncClient, job_id: str, *, timeout_s: int = 180, poll_every_s: float = 1.5) -> dict:
    url = f"{LLAMA_BASE.rstrip('/')}/api/v1/extraction/jobs/{job_id}"
    deadline = asyncio.get_event_loop().time() + timeout_s
    last_status = None
    while True:
        r = await client.get(url, headers=_auth_headers(), timeout=30)
        if r.status_code >= 400:
            raise LlamaCloudError(f"Poll extract job failed: {r.status_code} {r.text}")
        payload = r.json()
        status = (payload.get("status") or "").upper()
        if status != last_status:
            last_status = status
        if status in ("SUCCESS", "COMPLETED", "DONE"):
            return payload
        if status in ("ERROR", "FAILED"):
            raise LlamaCloudError(f"Extract job error: {json.dumps(payload)[:400]}")
        if asyncio.get_event_loop().time() > deadline:
            raise LlamaCloudError("Timed out waiting for extract job to complete")
        await asyncio.sleep(poll_every_s)

async def _extraction_fetch_result(client: httpx.AsyncClient, job_id: str) -> dict:
    url = f"{LLAMA_BASE.rstrip('/')}/api/v1/extraction/jobs/{job_id}/result"
    r = await client.get(url, headers=_auth_headers(), timeout=60)
    if r.status_code >= 400:
        raise LlamaCloudError(f"Fetch extract result failed: {r.status_code} {r.text}")
    return r.json()

# --- replace your _extract_stateless with this one ---
async def _extract_stateless(client: httpx.AsyncClient, *, file_id: str, schema: dict) -> dict:
    """
    Run stateless extraction, poll until done, then fetch the result payload.
    """
    url = f"{LLAMA_BASE.rstrip('/')}/api/v1/extraction/run"
    payload = {
        "data_schema": schema,
        "config": {"extraction_target": "PER_DOC"},
        "file_id": file_id,
    }
    r = await client.post(
        url,
        headers={**_auth_headers(), "Content-Type": "application/json"},
        json=payload,
        timeout=120,
    )
    if r.status_code >= 400:
        raise LlamaCloudError(f"LlamaExtract failed to start: {r.status_code} {r.text}")
    job = r.json()
    job_id = job.get("id")
    if not job_id:
        # If your tenant returns results immediately, just pass it through.
        return job

    # Poll to completion, then fetch the result
    await _extraction_poll(client, job_id)
    return await _extraction_fetch_result(client, job_id)


def _normalize_extract_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize common response shapes to a dict of extracted fields.
    """
    for key in ("data", "result", "extracted", "fields", "output"):
        val = payload.get(key)
        if isinstance(val, dict):
            return val
    for key in ("data", "result", "records"):
        val = payload.get(key)
        if isinstance(val, list):
            return {"records": val}
    return {"_raw": payload}

# =============================== MODELS ======================================
class HealthSchemaResponse(BaseModel):
    ok: bool
    schemaPath: Optional[str] = None
    loaded: Optional[bool] = None

class ProcessResponse(BaseModel):
    ok: bool
    extractedData: Optional[dict] = None
    error: Optional[str] = None

# ================================= ROUTES ====================================

@app.get("/api/health", response_model=HealthSchemaResponse)
def health(schema: Optional[int] = Query(default=None)):
    if schema is not None:
        return HealthSchemaResponse(ok=True, schemaPath=str(SCHEMA_PATH), loaded=bool(extraction_schema))
    return HealthSchemaResponse(ok=True)

@app.post("/api/process", response_model=ProcessResponse)
async def process(file: UploadFile = File(...)):
    if not LLAMA_KEY:
        raise HTTPException(status_code=500, detail="Missing LLAMACLOUD_API_KEY")
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")
    if extraction_schema is None:
        raise HTTPException(
            status_code=500,
            detail=f"Extraction schema not loaded. Implement schema load at {SCHEMA_PATH}."
        )

    dest_path = UPLOAD_DIR / file.filename
    try:
        with dest_path.open("wb") as out:
            shutil.copyfileobj(file.file, out)
    finally:
        await file.close()

    # ---- parse (best-effort) + upload + stateless extract
    try:
        async with httpx.AsyncClient() as client:
            # A) Best-effort LlamaParse (not required for extraction)
            try:
                parsed = await _llama_parse_upload(client, dest_path, file.content_type)
                job_id = parsed.get("job_id") or parsed.get("id")
                if job_id:
                    await _llama_parse_poll(client, job_id)
            except LlamaCloudError as e:
                # Don't fail the request—extraction does not require prior parse
                print(f"[warn] LlamaParse step skipped: {e}")

            # B) Required: upload file and run stateless extraction
            file_id = await _files_upload(client, dest_path, file.content_type)
            extract_payload = await _extract_stateless(client, file_id=file_id, schema=extraction_schema)
            extracted = _normalize_extract_payload(extract_payload)

            print(extracted)

            return ProcessResponse(ok=True, extractedData=extracted)

    except LlamaCloudError as e:
        return ProcessResponse(ok=False, error=str(e)[:1200])
    except httpx.HTTPError as e:
        return ProcessResponse(ok=False, error=f"HTTP error talking to LlamaCloud: {str(e)}")
    except Exception as e:
        return ProcessResponse(ok=False, error=f"Unexpected error: {type(e).__name__}: {e}")

# ============================== SERVER START =================================
# Run with: uvicorn server.main:app --reload --port 4000
