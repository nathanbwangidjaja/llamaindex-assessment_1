import os
import json
import shutil
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# ============================== ENV / CONSTANTS ==============================
PORT = int(os.getenv("PORT", "4000"))

LLAMA_BASE = os.getenv("LLAMACLOUD_BASE_URL")
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
    allow_origins=["*"],  # or lock down as needed
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

# =============================== MODELS (DO NOT CHANGE) ======================================
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
        raise HTTPException(status_code=400, detail="Unsupported file type")
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

    # ======= TODOs: Extract ============
    # Requirement: 
    # 1) Use LlamaParse AND LlamaExtract to process uploaded files
    # 2) Return Data in the format defined in {SCHEMA_PATH}

    # --- Placeholder so the route is callable for demostration:
    return ProcessResponse(
        ok=False,
        error="Not Implemented",
    )

# ============================== SERVER START =================================
# Run with: uvicorn server.main:app --reload --port 4000
