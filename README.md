# LlamaIndex Assessment – Insurance Document Processor

Welcome! You’ve been invited to complete a real-world coding challenge designed to reflect the kind of work you might actually do on the job.

This assessment is being delivered through Foretoken AI, a platform trusted by hiring teams to run realistic coding simulations.

---

## 📋 What You Need to Know

- Your **screen and audio recording** has already started (via your browser).
- Please **do not close or refresh the assessment tab** — doing so will stop the recording and may void your submission.
- You may use **any AI tools** (e.g. ChatGPT, GitHub Copilot, etc.)
- This is a **solo** exercise — no pair programming or external help allowed.

If you encounter issues, contact our team at **[assessment@foretokenai.com](mailto:assessment@foretokenai.com)** immediately.

---

## 💻 What You’ll Work On

You are given a **frontend (React)** and a **backend (Python/FastAPI)** scaffold. Your task is to **complete the missing functionality** so that a user can:

1. Upload an insurance document (PDF/DOCX/PPTX).  
2. View key information extracted from the document.

Most of the heavy lifting is left for you to implement — this README will walk you through exactly **what you have**, **what’s missing**, and **what you need to do**.

---

## Project Structure

```
.
├── fastapi_server/
│   ├── main.py                   # Backend FastAPI server (incomplete, needs you to finish)
│   ├── schema/
│   │   └── insurance.schema.json # JSON Schema you will use for extraction
│   ├── (.env)                    # To be created by yourself
│   └── uploads/                  # Temp upload folder (auto-created)
│
├── src/
│   ├── App.jsx                   # Frontend entry point
│   ├── components/
│   │   ├── DocumentUpload.jsx    # Component to handle file upload
│   │   └── DataDisplay.jsx       # Component to show extracted information (incomplete, needs you to finish)
│   └── App.css                   # Basic global styles
│
├── package.json
└── insurance_document.pdf        # Test insurance document

```

---
## Before Start

Before running the backend, you need to set up access to LlamaIndex Cloud.

1. Go to [https://cloud.llamaindex.ai/](https://cloud.llamaindex.ai/) and sign up or log in.
2. Navigate to your **API Keys** page and create a new key.
3. In the `server/` folder, create a new `.env` file with the following content:

```
PORT=4000
LLAMACLOUD_BASE_URL=https://api.cloud.llamaindex.ai
LLAMACLOUD_API_KEY=<your-api-key-here>
EXTRACTION_SCHEMA_PATH=schema/insurance.schema.json
```

Replace `<your-api-key-here>` with the actual key you generated.

> 📁 Note: The `.env` file is **not included** in the repo — you must create it yourself before running the backend.

Once your `.env` file is in place, you can start the project as described below.

---
## Backend (`fastapi_server/main.py`)

The backend is a **minimal FastAPI server**.  It currently sets up `/api/process` route but only returns “Not Implemented” for now.  

### What you need to implement:
- Use LlamaParse AND LlamaExtract to process uploaded files
- Return Data in the format defined in `insurance.schema.json`
---

## Frontend (`src/`)

The frontend is built with **React + Vite**, and provides a basic UI scaffold.

### What's already implemented

- `src/App.jsx`  
  - Manages app state: `uploadedFile`, `processing`, `error`, `extractedData`  
  - Handles the API call to `/api/process`

- `src/components/DocumentUpload.jsx`  
  - Provides the file upload interface  
  - Triggers `onFileUpload(file)` when a file is selected  

You do not need to modify these files.

### What you need to implement

#### `src/components/DataDisplay.jsx`

This component is responsible for rendering the extracted data returned from the backend.

You’ll receive a prop called `extractedData` (a JSON object), and your task is to display it in a clear, readable format.

You can choose how to present the data:
- A raw `<pre>{JSON.stringify(data, null, 2)}</pre>` block
- A recursive JSON viewer
- A field-by-field layout, grouping related values

There is no strict requirement on styling — focus on **clarity**, **completeness**, and **usability**.

---

## JSON & API Schema

The JSON schema is provided at:

```
server/schema/insurance.schema.json
```

This file defines the **structure of the extracted information** your backend must return. It includes fields such as `policy.number`, `effective_date`, `insureds`, `coverages`, and more.

Your backend must:
- ✅ **Load this schema** on startup (already scaffolded in `main.py`)  
- ✅ **Pass the schema** to LlamaExtract during the extraction process  
- ✅ **Return the extracted data** in the format defined by this schema

This extracted data should be returned inside the `extractedData` field of your API response. The full API response is shaped by the `ProcessResponse` model:

```python
class ProcessResponse(BaseModel):
    ok: bool
    extractedData: Optional[dict]
    error: Optional[str]
```

- `ok`: indicates whether the extraction succeeded  
- `extractedData`: must conform exactly to `insurance.schema.json`  
- `error`: includes any error message if the extraction failed

⚠️ **Important:** Do **not modify the schema file**. Your output will be validated against it, and any structural mismatch will result in test failures — even if the logic is correct.

---

## Getting Started

### 1. Install dependencies
```bash
# in project root
npm install
```

### 2. Start backend
```bash
cd fastapi_server
# recommended but not required
python3 -m venv venv
source venv/bin/activate
# install dependencies and run backend
pip install -r server/requirements.txt
uvicorn main:app --reload --port 4000
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

3. **Code & Documentation Quality (30%)**  
   - Modular, easy-to-understand code  
   - Good error handling  
   - Clear documentation when necessary

---

## Helpful Resources
- [LlamaIndex Docs](https://docs.llamaindex.ai/)  
- [LlamaParse](https://www.llamaindex.ai/llamaparse)  
- [LlamaExtract](https://www.llamaindex.ai/llamaextract)  
- [LlamaCloud](https://docs.cloud.llamaindex.ai/)  
- [React Docs](https://react.dev/)  
- [FastAPI Docs](https://fastapi.tiangolo.com/)