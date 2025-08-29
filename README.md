# LlamaIndex Assessment – Insurance Document Processor

This project is the **starting point** for your assessment. It demonstrates the overall structure of an insurance document processor application, but key functionality has been removed.
You are given a **frontend (React)** and a **backend (Node.js/Express)** scaffold.  
Your task is to **complete the missing functionality** so that a user can:

1. Upload an insurance document (PDF/DOCX/PPTX).  
2. Process it with **LlamaParse → LlamaExtract**.  
3. Display the extracted structured JSON on the frontend.

Most of the heavy lifting is left for you to implement — this README will walk you through exactly **what you have**, **what’s missing**, and **what you must do**.

---

## Project Structure

```
.
├── server/
│   ├── index.js                 # Backend Express server (incomplete, you must finish)
│   ├── schema/
│   │   └── extractionSchema.json # JSON Schema you will use for extraction
│   └── uploads/                 # Temp upload folder (auto-created)
│
├── src/
│   ├── App.jsx                  # Frontend entry point
│   ├── components/
│   │   ├── DocumentUpload.jsx   # Stub: implement drag/drop + file picker
│   │   └── DataDisplay.jsx      # Stub: implement structured JSON display
│   └── App.css                  # Basic global styles
│
├── package.json
└── insurance_document.pdf       # Test insurance document

```

---

## Backend (`server/index.js`)

The backend is a **minimal Express server**.  

It currently:
- Sets up `/api/process` route (but just returns “Not Implemented”).  
- Accepts file uploads via `multer`.  
- Leaves **TODOs** for you to complete the pipeline:
  - **LlamaParse**: upload → poll → fetch Markdown.  
  - **Files API** (if needed): upload parsed text.  
  - **LlamaExtract**: start extraction job with schema.  
  - Poll extraction → normalize results → return JSON.  

### What you must implement:
- Read the schema JSON:
  ```js
  // TODO[schema-1]
  extractionSchema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'))
  ```
- `/api/process` route:
  - Upload file → LlamaParse → wait for parse → get Markdown.
  - Upload Markdown (if required by tenant).
  - Start LlamaExtract job with `insurance.schema.json`.
  - Poll until SUCCESS.
  - Normalize the result (`result | data | results[0].result | download_url`).
  - Return:  
    ```json
    { "ok": true, "extractedData": { ...matches schema... } }
    ```

**Important:** No LlamaIndex API endpoints are provided.  
You must look them up in [LlamaCloud Docs](https://docs.cloud.llamaindex.ai/) and implement calls yourself.

---

## Frontend (`src/`)

The frontend is built with React + Vite.  
Currently, it has **stub components** that you must finish.

### `src/App.jsx`
- Holds main app state:
  - `uploadedFile`, `processing`, `error`, `extractedData`.
- Has a stub `handleFileUpload(file)` → you must connect it to your backend (`POST /api/process`).

### `src/components/DocumentUpload.jsx`
- UI for uploading files.
- Must implement:
  - Drag-and-drop.
  - Click-to-browse.
  - File validation (PDF/DOCX/PPTX, ≤10 MB).
  - Show upload progress + success state.
- Calls `onFileUpload(file)` when ready.

### `src/components/DataDisplay.jsx`
- UI for showing backend results.
- Must implement:
  - Loading state.
  - Error state.
  - Render extracted JSON nicely (tables, cards, etc.).
- Input: `extractedData` that matches the schema.

---

## JSON Schema

The schema lives at:

```
server/schema/extractionSchema.json
```

You **must** load this in your backend before extraction.  
It defines the shape of the expected JSON


## Getting Started

### 1. Install dependencies
```bash
# in project root
npm install
```

### 2. Start backend
```bash
cd server
node index.js
```
Runs at `http://localhost:4000`.

### 3. Start frontend
```bash
npm run dev --host
```
Runs at `http://localhost:5173`.

---

## Assessment Requirements

### Core Tasks
- Backend: Implement `/api/process` end-to-end with LlamaParse + LlamaExtract.
- Frontend: Implement upload UI & JSON display UI.
- Schema: Ensure extraction matches `extractionSchema.json`.
- Testing: Use `insurance_document.pdf` for testing

### Evaluation
1. **Backend (40%)**  
   - Correct LlamaParse + LlamaExtract pipeline  
   - Returns JSON in schema format  

2. **Frontend (30%)**  
   - Clean file upload flow  
   - Good error/loading states  
   - JSON displayed clearly  

3. **Code Quality (20%)**  
   - Clear, modular code  
   - Good error handling  

4. **Documentation (10%)**  
   - Clear commits + comments  
   - Updated README  

---

## Helpful Resources
- [LlamaIndex Docs](https://docs.llamaindex.ai/)  
- [LlamaParse](https://www.llamaindex.ai/llamaparse)  
- [LlamaExtract](https://www.llamaindex.ai/llamaextract)  
- [LlamaCloud](https://docs.cloud.llamaindex.ai/)  
- [React Docs](https://react.dev/)  

---

## Key Notes
- **Do not change the schema shape** 
- The backend currently just stubs `/api/process`.  
- You must look up the correct API endpoints from docs and implement.  
- You are graded on: **working code, clean design, and clear problem-solving**.  

---

This project is provided for **assessment purposes only**.
