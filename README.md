# LlamaIndex Assessment – Insurance Document Processor

This project is the **starting point** for your assessment. It demonstrates the overall structure of an insurance document processor application, but **key functionality has been removed**.  

Your task is to **implement both frontend and backend parts** so that users can upload documents, process them with **LlamaParse + LlamaExtract**, and display the structured results.

---

## 📂 Project Structure

Here’s what you’ll find in the repo:

### `src/App.jsx`
- **Entry point of the app**
- Handles overall state (`uploadedFile`, `processing`, `error`, `extractedData`)
- Contains `handleFileUpload` stub, which you must connect to your backend
- Renders two main sections:
  - **Document Upload** (left column)
  - **Extracted Data** (right column)

### `src/components/DocumentUpload.jsx`
- **Stub component**  
- Candidates must implement:
  - Drag-and-drop file upload
  - File type & size validation
  - Click-to-browse file picker
  - Progress state & success state
- Call `onFileUpload(file)` when a file is selected

### `src/components/DataDisplay.jsx`
- **Stub component**  
- Candidates must implement:
  - Loading state
  - Error state
  - Display extracted JSON data in a structured, styled layout
- JSON schema provided below

### `src/App.css`
- Basic global styles
- You can extend with your own Tailwind / custom classes

---

## 🛠 Features You Must Implement

### Frontend
- Drag-and-drop + click-to-browse file upload  
- File validation: only **PDF, DOCX, PPTX**, max **10 MB**  
- Progress tracking (showing upload/processing state)  
- Error handling (bad file, failed API, etc.)  
- Structured data visualization in `DataDisplay`  

### Backend
- API endpoint(s) to:
  1. Accept file upload (direct upload or presigned URL approach)
  2. Call **LlamaParse** to parse the document
  3. Call **LlamaExtract** to extract structured information
  4. Return JSON in the expected schema
- Optional: Save results to a database (e.g., Supabase)

---

## 📦 Expected JSON Schema

Your backend should return extracted data in this format:

```json
{
  "policy_holder_info": {
    "name": "string",
    "address": "string",
    "date_of_birth": "string",
    "policy_number": "string"
  },
  "insurance_details": {
    "type": "string",
    "coverage_amount": "number",
    "start_date": "string",
    "end_date": "string",
    "premium": {
      "amount": "number",
      "frequency": "string"
    }
  },
  "covered_items": [
    {
      "item_name": "string",
      "description": "string",
      "value": "number"
    }
  ],
  "education": {
    "school": "string",
    "degree": "string",
    "graduation_year": "number"
  },
  "attributes": [
    {
      "key": "string",
      "value": "string"
    }
  ]
}
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation
```bash
# Clone repo & install deps
pnpm install

# Start dev server
pnpm run dev --host
```

Visit `http://localhost:5173`

---

## ✅ Assessment Requirements

### Core Functionality
- Implement **file upload** flow (frontend + backend)
- Integrate **LlamaParse + LlamaExtract**
- Display structured data with responsive UI
- Handle errors & edge cases gracefully

### Evaluation Criteria
1. **Technical Implementation (40%)**  
   - Working frontend uploader  
   - Working backend API routes  
   - Correct integration with LlamaIndex services  

2. **Code Quality (25%)**  
   - Clean, modular React components  
   - Clear backend code organization  
   - Proper error handling  

3. **LlamaIndex Usage (20%)**  
   - Effective use of LlamaParse + LlamaExtract  
   - Proper configuration  

4. **Problem Solving (10%)**  
   - How you handle edge cases  
   - Any creative improvements  

5. **Documentation (5%)**  
   - Clear README updates  
   - Inline code comments  

---

## 📚 Resources
- [LlamaIndex Docs](https://docs.llamaindex.ai/)  
- [LlamaParse Docs](https://www.llamaindex.ai/llamaparse)
- [LlamaExtract Docs](https://www.llamaindex.ai/llamaextract)
- [LlamaCloud Docs](https://docs.cloud.llamaindex.ai/)  
- [React Docs](https://react.dev/)  
- [Supabase Docs](https://supabase.com/docs)  

---

## 🔑 Key Notes
- You **must implement both frontend & backend**.  
- The current `handleFileUpload` in `App.jsx` throws an error intentionally—replace it with your real pipeline.  
- `DocumentUpload.jsx` and `DataDisplay.jsx` are stubs—build them out yourself.  

---

This project is provided for **assessment purposes only**.
