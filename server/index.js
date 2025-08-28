// server/index.js
import 'dotenv/config.js'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'

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
const SCHEMA_PATH = process.env.EXTRACTION_SCHEMA_PATH || path.join(process.cwd(), 'schema/insurance.schema.json')

if (!LLAMA_KEY) {
  console.warn(' Missing LLAMACLOUD_API_KEY (set it in your .env)')
}

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
//   Example (implement yourself):
//     let extractionSchema
//     try {
//       extractionSchema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'))
//     } catch (e) {
//       console.error('Failed to load schema:', e)
//     }
let extractionSchema

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

  // TODO[impl-1]: Implement LlamaParse upload (multipart/form-data) → returns a job/id you can poll.
  // TODO[impl-2]: Poll LlamaParse until success (status value depends on your tenant).
  // TODO[impl-3]: Fetch Markdown (or plaintext) for the parsed document.
  // TODO[impl-4]: Upload parsed text to Files API (or pass text directly if supported).
  // TODO[impl-5]: Get your default extraction agent (project-scoped if applicable).
  // TODO[impl-6]: Start LlamaExtract job with { extraction_agent_id, file_id (or text), data_schema_override: extractionSchema }.
  // TODO[impl-7]: Poll extraction job to SUCCESS; then GET the result.
  // TODO[impl-8]: Normalize result shapes:
  //               { result } | { data } | { results: [ { result } ] } | { download_url }
  // TODO[impl-9]: Return { ok: true, extractedData } so the frontend can render it.

  // Temporary placeholder so the route is callable during development:
  return res.status(501).json({
    ok: false,
    error: 'Not Implemented',
    next_steps: [
      'Implement LlamaParse upload + polling',
      'Fetch Markdown text',
      'Run LlamaExtract with your JSON schema',
      'Normalize result and return { ok: true, extractedData }',
    ],
  })
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
