import os
import httpx
from typing import Optional

LLAMA_BASE = os.getenv("LLAMACLOUD_BASE_URL")
LLAMA_KEY  = os.getenv("LLAMACLOUD_API_KEY")
LLAMA_ORG_ID = os.getenv("LLAMA_ORG_ID")
LLAMA_PROJECT_ID = os.getenv("LLAMA_PROJECT_ID")

def _headers():
    h = {"Authorization": f"Bearer {LLAMA_KEY}"}
    if LLAMA_ORG_ID: h["X-LLM-Organization"] = LLAMA_ORG_ID
    if LLAMA_PROJECT_ID: h["X-LLM-Project"] = LLAMA_PROJECT_ID
    return h

async def llamaparse_upload(filepath: str) -> str:
    """POST multipart to LlamaParse → return job/id."""
    # TODO[impl-1]
    raise NotImplementedError

async def llamaparse_poll_until_done(job_id: str) -> dict:
    """Poll job until success/error; return final job payload."""
    # TODO[impl-2]
    raise NotImplementedError

async def llamaparse_fetch_markdown(job_id: str) -> str:
    """GET parsed markdown/plaintext."""
    # TODO[impl-3]
    raise NotImplementedError

async def files_upload_text(text: str) -> str:
    """Upload text to Files API (return file_id) if your tenant requires it."""
    # TODO[impl-4]
    raise NotImplementedError

async def get_default_extraction_agent() -> str:
    """Return extraction_agent_id for your tenant/project."""
    # TODO[impl-5]
    raise NotImplementedError

async def start_extraction_job(agent_id: str, *, file_id: Optional[str] = None, text: Optional[str] = None, schema_override: dict = None) -> str:
    """Start LlamaExtract job; return job_id."""
    # TODO[impl-6]
    raise NotImplementedError

async def poll_extraction_until_done(job_id: str) -> dict:
    """Poll extract job to success/error; return final job payload."""
    # TODO[impl-7]
    raise NotImplementedError

async def fetch_extraction_result(job_id: str) -> dict:
    """Fetch the result payload and normalize {result|data|results|download_url}."""
    # TODO[impl-8]
    raise NotImplementedError
