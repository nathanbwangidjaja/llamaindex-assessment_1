# LlamaIndex Full-Stack Assessment: Insurance Document Processing

## Welcome!

This repository contains a Next.js starter template designed to help you kickstart your LlamaIndex Full-Stack Assessment. This assessment evaluates your ability to build a full-stack application that leverages LlamaIndex for intelligent document processing and integrates with a local database.

**Please read this README carefully. It contains all the instructions, requirements, and guidelines for your assessment.**

---

## 1. Assessment Objective

Your primary goal is to develop a web application that can:

1.  **Accept insurance documents** (PDF, DOCX) via a user-friendly drag-and-drop interface.
2.  **Process these documents** using LlamaIndex services (LlamaParse and LlamaExtract).
3.  **Extract specific structured data** from the documents according to a predefined JSON schema.
4.  **Store the extracted data** in a local database.
5.  **Display the extracted data** on the frontend.
6.  **Export the extracted data** from the `EVAL_` documents into a structured file for submission.

This assessment is designed to test your practical development skills, your understanding of LlamaIndex capabilities, and your ability to integrate various technologies into a cohesive, functional application. **It is NOT solvable by simply prompting a Large Language Model (LLM) to generate the solution.** You are expected to write and integrate code, configure services, and debug issues as a human developer would.

## 2. Problem Context: Automating Insurance Data Extraction

Insurance companies frequently deal with a high volume of diverse documents (policies, claims, certificates) that contain critical information in unstructured or semi-structured formats. Manually extracting this data is time-consuming and prone to human error. Your application will automate this process, allowing users to upload documents and have the key information automatically extracted and structured for further use.

## 3. Core Components & Technologies

Your solution should comprise the following key components:

### 3.1. Frontend Application

*   **Framework:** Next.js
*   **Key Functionality to Implement:**
    *   **File Upload Interface:** Create a clear and intuitive drag-and-drop area for users to upload insurance documents. It should visually indicate accepted file types (PDF, DOCX) and a maximum file size (10MB).
    *   **User Feedback:** Provide real-time visual feedback during the entire document processing lifecycle. This includes:
        *   Loading indicators/spinners while a document is being uploaded, parsed, extracted, and stored.
        *   Progress messages (e.g., "Uploading...", "Parsing document...", "Extracting data...", "Saving to database...").
        *   Clear success messages upon completion and informative error messages if something goes wrong (e.g., "Invalid file type", "Processing failed: [Error Details]").
    *   **Data Presentation:** After successful extraction and storage, retrieve the data from your local database and display it on the frontend in an organized, readable format. This display should clearly map to the provided JSON schema, handling nested objects and arrays intuitively.
    *   **Data Export:** Implement a mechanism (e.g., a button) to export the extracted data from the `EVAL_` documents (after they have been processed and stored) into a structured file format (e.g., JSON). This exported file will be part of your submission.
    *   **Responsiveness:** Ensure your application's layout and functionality adapt gracefully across various screen sizes (desktop, tablet, mobile).
*   **Styling:** This template includes **Tailwind CSS** for rapid styling. You are encouraged to use it for a professional and aesthetically pleasing user interface.

### 3.2. Backend Application

*   **Framework:** Next.js API Routes (This template includes a placeholder API route at `src/app/api/upload/route.ts`). You can also use a separate Node.js backend (e.g., Express.js) or Python (e.g., Flask, FastAPI) if you are more proficient, but Next.js API Routes are recommended for simplicity and full-stack integration.
*   **Key Logic to Implement:** Your backend must:
    *   Receive the uploaded document files from the frontend.
    *   Orchestrate the calls to the LlamaParse and LlamaExtract APIs.
    *   Manage the storage of the extracted data into your local database.
    *   Implement robust error handling for all external API calls (LlamaParse, LlamaExtract) and internal processing. Errors should be caught, logged (if applicable), and meaningful error messages should be returned to the frontend.

### 3.3. LlamaIndex Integration

This is a core part of the assessment. You will need to interact with LlamaCloud services.

*   **LlamaParse API:**
    *   **Purpose:** To intelligently parse complex documents (PDFs, DOCX, PPTX), extracting text, tables, and other elements into a structured intermediate format (e.g., Markdown).
    *   **Integration:** Your backend will send the uploaded document to the LlamaParse API. You will need to obtain an API key from [LlamaCloud](https://cloud.llamaindex.ai/) and configure your calls appropriately.
    *   **Documentation:** Refer to the [LlamaParse documentation](https://docs.llamaindex.ai/en/stable/community/llamacloud_llama_parse/) for details on API endpoints, request/response formats, and configuration options (e.g., `result_type`, `parsing_instruction`). Consider using `result_type='markdown'` as it often works well for subsequent LlamaExtract processing.

*   **LlamaExtract:**
    *   **Purpose:** To transform the parsed output from LlamaParse into a predefined JSON schema.
    *   **Integration:** After receiving the parsed content from LlamaParse, you will feed this content into LlamaExtract, along with the target JSON schema (provided in Section 4.1). LlamaExtract will then use an LLM to extract data that strictly conforms to your schema.
    *   **Documentation:** Refer to the [LlamaExtract documentation](https://docs.llamaindex.ai/en/stable/community/llamacloud_llama_extract/) for guidance on defining extraction schemas and making API calls.
    *   **Schema Adherence:** The output from LlamaExtract must strictly conform to the provided JSON schema, including handling nested objects, arrays, and correct data types.

### 3.4. Local Database Integration

*   **Database:** You are free to choose any local database (e.g., SQLite, PostgreSQL, MongoDB). **SQLite is highly recommended for simplicity** as it requires minimal setup and is file-based.
*   **Data Storage:** Design your database schema (tables, columns, relationships) to accurately represent the provided JSON schema. Store the structured data extracted by LlamaExtract into this local database.
*   **Data Management:** Ensure proper data types are used. Consider how to store nested objects and arrays (e.g., using separate tables with foreign keys, or JSONB columns for complex objects). You should also store a reference to the original document (e.g., filename) to identify data from `EVAL_` documents.

## 4. Assessment Workflow

1.  **File Upload:** The user drags and drops an insurance document onto your frontend interface.
2.  **Backend Processing:** Your frontend sends the document to your backend API endpoint (e.g., `/api/upload`).
3.  **LlamaParse:** Your backend calls the LlamaParse API, sending the document for parsing. It receives the parsed content.
4.  **LlamaExtract:** The parsed output from LlamaParse is then fed to LlamaExtract, which extracts data according to the specified JSON schema.
5.  **Database Storage:** The extracted structured data is then stored in your local database.
6.  **Frontend Display:** The extracted data is retrieved from your local database and displayed on the frontend, confirming successful processing.
7.  **Data Export:** After processing the `EVAL_` documents, you will use the implemented export mechanism to generate a file containing the extracted data from these specific documents.

## 5. Provided Resources

### 5.1. Expected JSON Schema

Your application must extract data into the following JSON schema. You are responsible for mapping this schema to your database tables and ensuring all fields are correctly populated. The TypeScript types for this schema are already provided in `src/lib/types.ts`.

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

### 5.2. Test Documents for Final Evaluation

*(These documents will be provided to you in the same assessment package.)*

These documents will have specific filenames (e.g., `EVAL_insurance_policy_001.pdf`, `EVAL_home_insurance_002.pdf`). You are free to use other documents for your development and testing. However, for the final evaluation, you **must** process these exact `EVAL_` documents through your application. The data extracted from these `EVAL_` documents must be included in your final data export.

## 6. Getting Started with the Starter Template

This repository is a Next.js project bootstrapped with `create-next-app`.

### Prerequisites

-   Node.js 18.x or higher
-   npm (Node Package Manager)

### Installation

1.  **Clone this repository or extract the provided zip file.**

2.  **Navigate into the project directory:**
    ```bash
    cd llamaindex-starter
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Set up Environment Variables:**
    *   Create a file named `.env.local` in the root of your project (next to `package.json`).
    *   Copy the contents of `.env.example` into `.env.local`.
    *   Fill in your `LLAMA_CLOUD_API_KEY` (from [LlamaCloud](https://cloud.llamaindex.ai/)).

    ```env
    # LlamaCloud API Keys
    LLAMA_CLOUD_API_KEY=your_llamacloud_api_key_here
    
    # Database Configuration (for local database)
    # Example for SQLite with Prisma: file:./dev.db
    DATABASE_URL=file:./dev.db
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

6.  **Open your browser:**
    Navigate to [http://localhost:3000](http://localhost:3000) to see the basic application running.

### Project Structure Overview

```
llamaindex-starter/
├── src/
│   ├── app/                 # Next.js App Router pages and layouts
│   │   ├── api/            # Your backend API routes (e.g., for file upload)
│   │   ├── globals.css     # Global Tailwind CSS styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Main application page (where you'll build your UI)
│   ├── components/         # Directory for your React components
│   └── lib/               # Utility functions, helpers, and type definitions
│       └── types.ts        # TypeScript interfaces for the JSON schema
├── public/                # Static assets (images, etc.)
├── .env.example          # Example environment variables (DO NOT COMMIT .env.local)
├── next.config.js        # Next.js configuration
├── package.json          # Project dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## 7. Implementation Guidance & Tips

*   **Frontend (src/app/page.tsx and src/components/):**
    *   Start by implementing the drag-and-drop file upload component. Libraries like `react-dropzone` can simplify this.
    *   Design your UI to clearly show the processing status (uploading, parsing, extracting, storing) using the `ProcessingStatus` type defined in `src/lib/types.ts`.
    *   Think about how to display the extracted `ExtractedInsuranceData` (also from `src/lib/types.ts`) in a user-friendly way. Consider using tables, cards, or expandable sections for nested data.
    *   **Implement a Data Export Button:** Add a button to your UI that, when clicked, triggers an API call to your backend to export the data extracted from the `EVAL_` documents. This export should be a JSON file containing an array of all extracted `ExtractedInsuranceData` objects.

*   **Backend (src/app/api/upload/route.ts and a new export API route):**
    *   The `route.ts` file already has basic file validation. Your main task here is to integrate LlamaParse, LlamaExtract, and your local database.
    *   **LlamaParse Integration:** You will send the `File` object (or its content) to the LlamaParse API. Remember to include your `LLAMA_CLOUD_API_KEY` in the request headers.
    *   **LlamaExtract Integration:** After getting the parsed content from LlamaParse, you will call LlamaExtract. You will need to define the extraction schema (which is the JSON schema from Section 4.1) within your LlamaExtract call. The `llamaindex` npm package might be helpful here.
    *   **Local Database Integration:** Choose a local database (e.g., SQLite with Prisma, or a simple `sqlite3` npm package if using Node.js). Design your database schema to store the extracted `ExtractedInsuranceData` objects. You will need to add a field to track which `EVAL_` document the data came from.
    *   **Data Export API Route:** Create a new API route (e.g., `/api/export`) that, when called, queries your local database for all data extracted from the `EVAL_` documents and returns it as a JSON array. This will be the file you submit.

*   **Error Handling:** Implement `try-catch` blocks for all API calls and database operations. Return meaningful error messages to the frontend so the user understands what went wrong.

*   **Type Safety:** Leverage the TypeScript types provided in `src/lib/types.ts` to ensure type safety throughout your application, especially when handling extracted data.

*   **Recommended Libraries (install via `npm install <package-name>`):
    *   `react-dropzone`: For easy drag-and-drop file uploads.
    *   `llamaindex`: The official LlamaIndex SDK for Node.js/TypeScript (can simplify LlamaParse/LlamaExtract calls).
    *   `sqlite3` (if using Node.js for SQLite) or `prisma` (for ORM with SQLite/PostgreSQL).
    *   `axios` or `node-fetch`: For making HTTP requests (if not using native `fetch`).

## 8. Evaluation Criteria

Your solution will be evaluated across the following dimensions:

### 8.1. Technical Implementation (40%)
*   **Frontend Functionality:** Robust drag-and-drop, clear user feedback, responsive design, and functional data export.
*   **Backend Logic:** Correct handling of file uploads, API orchestration, and error management.
*   **LlamaIndex Integration:** Effective and accurate use of LlamaParse and LlamaExtract APIs, demonstrating understanding of their configurations and capabilities.
*   **Database Integration:** Correct data modeling, storage, and retrieval from your local database, adhering to the provided schema.

### 8.2. Code Quality & Architecture (25%)
*   **Code Organization:** Clean, modular, and well-structured codebase.
*   **Readability:** Clear, concise, and well-commented code.
*   **Best Practices:** Adherence to modern development standards (e.g., proper state management, component reusability, API design principles).
*   **Error Handling:** Comprehensive and graceful error handling throughout the application.

### 8.3. LlamaIndex Understanding (20%)
*   Demonstrated ability to configure LlamaParse for optimal document parsing.
*   Effectiveness in designing and implementing LlamaExtract prompts/schemas for accurate data extraction.
*   Understanding of the LlamaIndex ecosystem and how its components fit together.

### 8.4. Problem-Solving & Innovation (10%)
*   Ability to tackle challenges encountered during development.
*   Thoughtfulness in technical decisions and trade-offs.
*   Any creative solutions or optimizations implemented (e.g., performance improvements, enhanced UX).

### 8.5. Documentation & Communication (5%)
*   A clear `README.md` file in your repository with setup instructions, project structure, and how to run the application.
*   Explanation of key design decisions and any challenges faced.

## 9. Submission Guidelines

Your submission should include:

1.  **Source Code:** A link to a public Git repository (e.g., GitHub, GitLab) containing your complete project source code.
2.  **Deployment Instructions:** Clear, step-by-step instructions on how to set up and run your application locally from your repository.
3.  **Live Demo (Optional but Recommended):** If possible, deploy your application to a public URL (e.g., Vercel, Netlify, Render) for easier review. Provide the URL in your README.
4.  **Extracted Data File:** A JSON file containing the extracted data from the `EVAL_` documents. This file should be generated using the export mechanism you implement.

## 10. Testing & Evaluation Process

Upon submission, your application will be tested using the provided `EVAL_` test documents. We will upload these documents through your application's interface. We will then use your provided data export file and compare its contents against our expected outputs (`EVAL_expected_outputs.json`). We will specifically look for data associated with these `EVAL_` documents.

## 11. Stretch Goal (Optional)

*   **Information Retrieval:** Implement a feature that allows users to query the stored structured data (e.g., a search bar to find policies by policyholder name, or filter by coverage type). This demonstrates your ability to leverage the structured data for downstream applications.

## 12. Conclusion

This assessment is designed to be a realistic and challenging exercise that showcases your full-stack development skills, your understanding of LlamaIndex capabilities, and your ability to build robust, data-driven applications. Good luck!

