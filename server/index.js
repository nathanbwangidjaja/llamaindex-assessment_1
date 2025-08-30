// server/index.js
import 'dotenv/config.js'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import FormData from 'form-data'

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

/* ============================== ENV / CONSTANTS ============================== */
const PORT = process.env.PORT || 4000

// Required for your HTTP calls, but this file does NOT use them directly.
// Candidates will read these in their own code.
const LLAMA_BASE = process.env.LLAMACLOUD_BASE_URL        // e.g., https://api.cloud.llamaindex.ai
const LLAMA_KEY  = process.env.LLAMACLOUD_API_KEY         // bearer token

// Optional scoping; pass if your tenant needs them.
const LLAMA_ORG_ID     = process.env.LLAMA_ORG_ID
const LLAMA_PROJECT_ID = process.env.LLAMA_PROJECT_ID

// Where to load the extraction schema from (JSON file on disk)
const SCHEMA_PATH = process.env.EXTRACTION_SCHEMA_PATH || path.join(process.cwd(), 'schema/extractionSchema.json')

if (!LLAMA_KEY) {
  console.warn(' Missing LLAMACLOUD_API_KEY (set it in your .env)')
}

// Timeouts / polling (kept configurable)
const AXIOS_TIMEOUT           = Number(process.env.AXIOS_TIMEOUT_MS || 180000)   // 3 min
const PARSE_JOB_TIMEOUT_MS    = Number(process.env.PARSE_JOB_TIMEOUT_MS || 300000) // 5 min
const PARSE_JOB_INTERVAL_MS   = Number(process.env.PARSE_JOB_INTERVAL_MS || 2000)  // 2s
const EXTRACT_JOB_TIMEOUT_MS  = Number(process.env.EXTRACT_JOB_TIMEOUT_MS || 300000) // 5 min
const EXTRACT_JOB_INTERVAL_MS = Number(process.env.EXTRACT_JOB_INTERVAL_MS || 3000)  // 3s

/* ================================== UPLOADS ================================= */
const UPLOAD_DIR = 'uploads'
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ok = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ].includes(file.mimetype)
    cb(ok ? null : new Error('Unsupported file type'), ok)
  },
})

/* ============================ EXTRACTION SCHEMA ============================= */
// TODO[schema-1]: Load the JSON schema from SCHEMA_PATH and assign to `extractionSchema`.
let extractionSchema
try {
  extractionSchema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'))
  console.log(`[${new Date().toISOString()}] Loaded extraction schema from ${SCHEMA_PATH}`)
} catch (e) {
  console.error('Failed to load schema:', e?.message || e)
  extractionSchema = { type: 'object', additionalProperties: true }
}

/* ============================== INTERNAL HELPERS ============================ */
const LOG_PREFIX = () => new Date().toISOString()
let REQ_SEQ = 0
const reqId = () => (++REQ_SEQ).toString().padStart(4, '0')

function log(id, msg, extra) {
  const base = `[${LOG_PREFIX()}] [req:${id}] ${msg}`
  if (extra !== undefined) {
    try { console.log(base, typeof extra === 'string' ? extra : JSON.stringify(extra)) }
    catch { console.log(base, extra) }
  } else {
    console.log(base)
  }
}
app.use((req, _res, next) => { req._id = reqId(); log(req._id, `${req.method} ${req.url}`); next() })

function axiosErr(e) {
  if (!e) return 'Unknown error'
  if (e.response) {
    return {
      status: e.response.status,
      statusText: e.response.statusText,
      data: e.response.data,
      headers: e.response.headers,
      url: e.config?.url,
      method: e.config?.method,
    }
  }
  return { message: e.message || String(e) }
}
function bytes(n) {
  if (n == null) return 'n/a'
  const u = ['B', 'KB', 'MB', 'GB']; let i = 0; let v = Number(n)
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(2)} ${u[i]}`
}
function previewString(str, max = 1024) {
  if (typeof str !== 'string') return ''
  return str.length > max ? `${str.slice(0, max)}… (+${str.length - max} chars)` : str
}
function startTimer() {
  const t0 = Date.now()
  return () => `${(Date.now() - t0).toFixed(0)}ms`
}
function writeStringToTempFile(id, text, ext = '.txt') {
  const fname = `parsed-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  const fpath = path.join(UPLOAD_DIR, fname)
  fs.writeFileSync(fpath, text, 'utf8')
  log(id, 'Wrote temp text file', { path: fpath, size: bytes(Buffer.byteLength(text)) })
  return fpath
}

/* ============================== LLAMA FILES API ============================ */
async function uploadFileToFilesAPI(id, localPath, originalName, mime = 'application/pdf') {
  const t = startTimer()
  const form = new FormData()
  form.append('upload_file', fs.createReadStream(localPath), { filename: originalName, contentType: mime })
  try {
    const resp = await axios.post(
      `${LLAMA_BASE}/api/v1/files`,
      form,
      {
        headers: { Authorization: `Bearer ${LLAMA_KEY}`, ...form.getHeaders() },
        params: {
          ...(LLAMA_ORG_ID ? { organization_id: LLAMA_ORG_ID } : {}),
          ...(LLAMA_PROJECT_ID ? { project_id: LLAMA_PROJECT_ID } : {}),
        },
        maxBodyLength: Infinity,
        timeout: AXIOS_TIMEOUT,
      }
    )
    log(id, `files api upload ok in ${t()}`, { file_id: resp.data?.id, name: resp.data?.name, size: resp.data?.file_size })
    return resp.data
  } catch (e) {
    log(id, 'files api upload FAILED', axiosErr(e))
    throw e
  }
}

/* ================================= LLAMAPARSE =============================== */
async function llamaparseUpload(id, localPath, originalName, mime = 'application/pdf') {
  const t = startTimer()
  const form = new FormData()
  form.append('file', fs.createReadStream(localPath), { filename: originalName, contentType: mime })
  try {
    const resp = await axios.post(
      `${LLAMA_BASE}/api/v1/parsing/upload`,
      form,
      {
        headers: { Authorization: `Bearer ${LLAMA_KEY}`, ...form.getHeaders() },
        params: {
          ...(LLAMA_ORG_ID ? { organization_id: LLAMA_ORG_ID } : {}),
          ...(LLAMA_PROJECT_ID ? { project_id: LLAMA_PROJECT_ID } : {}),
        },
        maxBodyLength: Infinity,
        timeout: AXIOS_TIMEOUT,
      }
    )
    log(id, `LlamaParse upload OK in ${t()}`, resp.data)
    return resp.data
  } catch (e) {
    log(id, 'LlamaParse upload FAILED', axiosErr(e))
    throw e
  }
}
async function getParseJob(id, jobId) {
  try {
    const resp = await axios.get(
      `${LLAMA_BASE}/api/v1/parsing/job/${encodeURIComponent(jobId)}`,
      {
        headers: { Authorization: `Bearer ${LLAMA_KEY}` },
        params: {
          ...(LLAMA_ORG_ID ? { organization_id: LLAMA_ORG_ID } : {}),
          ...(LLAMA_PROJECT_ID ? { project_id: LLAMA_PROJECT_ID } : {}),
        },
        timeout: AXIOS_TIMEOUT,
      }
    )
    return resp.data
  } catch (e) {
    log(id, 'LlamaParse get job FAILED', axiosErr(e))
    throw e
  }
}
async function pollParseJob(id, jobId, { timeoutMs = PARSE_JOB_TIMEOUT_MS, intervalMs = PARSE_JOB_INTERVAL_MS } = {}) {
  const t = startTimer(); let tries = 0
  for (;;) {
    const info = await getParseJob(id, jobId)
    const s = info?.status
    if (tries % 5 === 0) log(id, `LlamaParse status: ${s} (after ${t()})`)
    if (s === 'SUCCESS') { log(id, `LlamaParse success in ${t()}`); return info }
    if (s === 'ERROR') throw new Error(info?.error?.message || 'LlamaParse job failed')
    if (tries * intervalMs > timeoutMs) throw new Error('Timed out waiting for LlamaParse job')
    tries++; await new Promise(r => setTimeout(r, intervalMs))
  }
}
async function getParseMarkdown(id, jobId) {
  const t = startTimer()
  try {
    const resp = await axios.get(
      `${LLAMA_BASE}/api/v1/parsing/job/${encodeURIComponent(jobId)}/result/markdown`,
      {
        headers: { Authorization: `Bearer ${LLAMA_KEY}` },
        params: {
          ...(LLAMA_ORG_ID ? { organization_id: LLAMA_ORG_ID } : {}),
          ...(LLAMA_PROJECT_ID ? { project_id: LLAMA_PROJECT_ID } : {}),
        },
        timeout: AXIOS_TIMEOUT,
      }
    )
    const body = resp.data
    const md = typeof body === 'string' ? body : (body?.data ?? JSON.stringify(body))
    log(id, `Fetched Markdown in ${t()}`, { preview: previewString(md, 512) })
    return md
  } catch (e) {
    log(id, 'Get Markdown FAILED', axiosErr(e))
    throw e
  }
}

/* ============================== EXTRACTION (JOBS) =========================== */
async function getDefaultAgent(id) {
  const t = startTimer()
  try {
    const resp = await axios.get(
      `${LLAMA_BASE}/api/v1/extraction/extraction-agents/default`,
      {
        headers: { Authorization: `Bearer ${LLAMA_KEY}` },
        params: {
          ...(LLAMA_ORG_ID ? { organization_id: LLAMA_ORG_ID } : {}),
          ...(LLAMA_PROJECT_ID ? { project_id: LLAMA_PROJECT_ID } : {}),
        },
        timeout: AXIOS_TIMEOUT,
      }
    )
    log(id, `Default extraction agent in ${t()}`, { agent_id: resp.data?.id, project_id: resp.data?.project_id, name: resp.data?.name })
    return resp.data
  } catch (e) {
    log(id, 'Get default agent FAILED', axiosErr(e))
    throw e
  }
}
async function startExtractionJob(id, agentId, fileId, schema) {
  const t = startTimer()
  const body = { extraction_agent_id: agentId, file_id: fileId, data_schema_override: schema }
  try {
    const resp = await axios.post(
      `${LLAMA_BASE}/api/v1/extraction/jobs`,
      body,
      {
        headers: { Authorization: `Bearer ${LLAMA_KEY}`, 'Content-Type': 'application/json' },
        params: {
          ...(LLAMA_ORG_ID ? { organization_id: LLAMA_ORG_ID } : {}),
          ...(LLAMA_PROJECT_ID ? { project_id: LLAMA_PROJECT_ID } : {}),
        },
        timeout: AXIOS_TIMEOUT,
      }
    )
    log(id, `Extraction job started in ${t()}`, { job_id: resp.data?.job_id || resp.data?.id, status: resp.data?.status })
    return resp.data
  } catch (e) {
    log(id, 'Start extraction job FAILED', axiosErr(e))
    throw e
  }
}
async function getExtractionJob(id, jobId, projectId) {
  try {
    const resp = await axios.get(
      `${LLAMA_BASE}/api/v1/extraction/jobs/${encodeURIComponent(jobId)}`,
      {
        headers: { Authorization: `Bearer ${LLAMA_KEY}` },
        params: {
          ...(LLAMA_ORG_ID ? { organization_id: LLAMA_ORG_ID } : {}),
          ...(projectId ? { project_id: projectId } : {}),
        },
        timeout: AXIOS_TIMEOUT,
      }
    )
    return resp.data
  } catch (e) {
    log(id, 'Get extraction job FAILED', axiosErr(e))
    throw e
  }
}
async function pollExtractionJob(id, jobId, projectId, { timeoutMs = EXTRACT_JOB_TIMEOUT_MS, intervalMs = EXTRACT_JOB_INTERVAL_MS } = {}) {
  const t = startTimer(); let tries = 0
  for (;;) {
    const info = await getExtractionJob(id, jobId, projectId)
    const s = info?.status
    if (tries % 5 === 0) log(id, `Extraction job status: ${s} (after ${t()})`)
    if (s === 'SUCCESS') { log(id, `Extraction job SUCCESS in ${t()}`); return info }
    if (s === 'ERROR') throw new Error(info?.error?.message || 'Extraction job failed')
    if (tries * intervalMs > timeoutMs) throw new Error('Timed out waiting for extraction job')
    tries++; await new Promise(r => setTimeout(r, intervalMs))
  }
}
async function getExtractionResult(id, jobId, projectId) {
  const t = startTimer()
  try {
    const resp = await axios.get(
      `${LLAMA_BASE}/api/v1/extraction/jobs/${encodeURIComponent(jobId)}/result`,
      {
        headers: { Authorization: `Bearer ${LLAMA_KEY}` },
        params: {
          ...(LLAMA_ORG_ID ? { organization_id: LLAMA_ORG_ID } : {}),
          ...(projectId ? { project_id: projectId } : {}),
        },
        timeout: AXIOS_TIMEOUT,
      }
    )
    log(id, `Fetched extraction result in ${t()}`, { has_result: !!resp.data?.result, has_results_array: Array.isArray(resp.data?.results) })
    return resp.data
  } catch (e) {
    log(id, 'Get extraction result FAILED', axiosErr(e))
    throw e
  }
}
function normalizeExtractionResult(payload) {
  if (!payload) return null
  if (payload.result) return payload.result
  if (payload.data) return payload.data
  if (payload.extraction_run?.result) return payload.extraction_run.result
  if (payload.run?.result) return payload.run.result
  if (Array.isArray(payload.results) && payload.results.length) {
    const first = payload.results[0]
    return first?.result ?? first?.data ?? null
  }
  if (typeof payload === 'object') return payload
  return null
}

/* ================================== ROUTES ================================== */

/**
 * POST /api/process
 * Accepts a file, then you must:
 *   1) Upload to LlamaParse
 *   2) Poll until parsed
 *   3) Fetch Markdown (or plain text) result
 *   4) (Option A) Upload that text to your Files API, then start LlamaExtract job
 *      (Option B) If your tenant supports direct text input, call LlamaExtract with it
 *   5) Poll extraction to SUCCESS, fetch result, normalize shapes
 *   6) Return { ok: true, extractedData } to match the provided frontend
 */
app.post('/api/process', upload.single('file'), async (req, res) => {
  if (!LLAMA_KEY) {
    return res.status(500).json({ ok: false, error: 'Missing LLAMACLOUD_API_KEY' })
  }
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No file uploaded or unsupported type' })
  }
  // TODO[schema-2]: Ensure your schema is loaded before proceeding.
  if (!extractionSchema) {
    return res.status(500).json({
      ok: false,
      error: `Extraction schema not loaded. Implement TODO[schema-1] to read ${SCHEMA_PATH}.`,
    })
  }

  const id = req._id || reqId()
  const { path: localPath, originalname, mimetype, size } = req.file
  log(id, 'Received file', { originalname, mimetype, size: bytes(size) })

  let tempTextPath = null
  const cleanup = () => {
    try { if (localPath && fs.existsSync(localPath)) fs.unlinkSync(localPath) } catch {}
    try { if (tempTextPath && fs.existsSync(tempTextPath)) fs.unlinkSync(tempTextPath) } catch {}
  }

  try {
    // Upload original to Files API (traceability)
    log(id, 'Uploading original file to Files API…')
    const origUpload = await uploadFileToFilesAPI(id, localPath, originalname, mimetype)
    const origFileId = origUpload?.id
    log(id, 'Starting LlamaParse upload…')
    const parseUp = await llamaparseUpload(id, localPath, originalname, mimetype)
    const parseJobId = parseUp?.job_id || parseUp?.id
    if (!parseJobId) throw new Error('LlamaParse upload returned no job_id')
    log(id, 'Polling LlamaParse job…', { job_id: parseJobId })
    await pollParseJob(id, parseJobId)

    // Fetch Markdown
    log(id, 'Fetching parsed Markdown…')
    const markdown = await getParseMarkdown(id, parseJobId)

    // Save to temp .txt --> upload to Files API
    tempTextPath = writeStringToTempFile(id, markdown, '.txt')
    const textUpload = await uploadFileToFilesAPI(id, tempTextPath, path.basename(tempTextPath), 'text/plain')
    const textFileId = textUpload?.id
    if (!textFileId) throw new Error('Uploading parsed text to Files API failed (no id)')
    log(id, 'Fetching default extraction agent…')
    const agent = await getDefaultAgent(id)
    const agentId = agent?.id
    const projectId = agent?.project_id || LLAMA_PROJECT_ID
    if (!agentId) throw new Error('Could not get default extraction agent')

    // Start extraction
    log(id, 'Starting extraction job on parsed text…')
    const jobStart = await startExtractionJob(id, agentId, textFileId, extractionSchema)
    const jobId = jobStart?.job_id || jobStart?.id
    if (!jobId) throw new Error('Extraction job did not return job_id')

    // Poll extraction
    log(id, 'Polling extraction job…', { job_id: jobId, project_id: projectId || '(default)' })
    await pollExtractionJob(id, jobId, projectId)

    // Fetch + normalize result
    log(id, 'Fetching extraction result…')
    const rawResult = await getExtractionResult(id, jobId, projectId)
    try { console.log(previewString(JSON.stringify(rawResult, null, 2), 4000)) } catch {}
    let extractedData = normalizeExtractionResult(rawResult)

    if (!extractedData && rawResult?.download_url) {
      log(id, 'Result provided as download_url, fetching…')
      const dl = await axios.get(rawResult.download_url, { timeout: AXIOS_TIMEOUT })
      extractedData = normalizeExtractionResult(dl.data) ?? dl.data
    }

    if (!extractedData) {
      throw new Error('Extraction finished but no structured data was found in result payload')
    }

    // Return result
    log(id, 'Extraction complete. Normalized data preview:')
    try { console.log(previewString(JSON.stringify(extractedData, null, 2), 4000)) } catch {}

    return res.json({
      ok: true,
      mode: 'parse_then_extract_jobs',
      original_file_id: origFileId,
      parsed_text_file_id: textFileId,
      extractedData,
      // parsed_markdown: markdown,
    })
  } catch (err) {
    log(id, 'Processing error', axiosErr(err))
    return res.status(500).json({
      ok: false,
      error: err?.response?.data?.error || err.message || 'Unknown error',
    })
  } finally {
    cleanup()
  }
})

/**
 * GET /api/health
 * Use this to quickly check the server and whether the schema is loaded.
 * - `GET /api/health?schema=1` → includes schema path + loaded flag
 */
app.get('/api/health', (req, res) => {
  if (req.query.schema) {
    return res.json({
      ok: true,
      schemaPath: SCHEMA_PATH,
      loaded: Boolean(extractionSchema),
    })
  }
  res.json({ ok: true })
})

/* ================================= START ==================================== */
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})

/* ================================ TODO LIST =================================
 * TODO[schema-1]  Load JSON schema from SCHEMA_PATH and assign to `extractionSchema`.
 * TODO[schema-2]  Fail fast in /api/process if schema not loaded (already wired).
 *
 * TODO[impl-1]    LlamaParse: POST upload (multipart) → parse job/id.
 * TODO[impl-2]    Poll LlamaParse job until SUCCESS; handle ERROR states + timeout.
 * TODO[impl-3]    Fetch parsed Markdown (or plaintext) from LlamaParse.
 * TODO[impl-4]    Upload parsed text to your Files API (if needed by your tenant).
 * TODO[impl-5]    Fetch default extraction agent (project-scoped if required).
 * TODO[impl-6]    Start LlamaExtract job with your JSON schema override.
 * TODO[impl-7]    Poll extraction job to completion; fetch result payload.
 * TODO[impl-8]    Normalize varying result shapes → a single JSON object.
 * TODO[impl-9]    Return { ok: true, extractedData } to match the FE contract.
 *
 * Hints (not endpoints):
 * - You will likely need HTTP client(s) (axios/fetch), multipart form-data, and polling.
 * - Respect tenant scoping if required (organization/project identifiers).
 * - Prefer small, clear helper functions you write yourself.
 */
