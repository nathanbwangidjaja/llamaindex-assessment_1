// App.jsx
import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Upload, FileText, Database, AlertCircle } from 'lucide-react'
import DocumentUpload from './components/DocumentUpload.jsx'
import DataDisplay from './components/DataDisplay.jsx'
import './App.css'

function App() {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  // const [currentStep, setCurrentStep] = useState(1)

  /**
   * Called by candidate's DocumentUpload implementation once a file is chosen.
   * They must implement the backend endpoint(s) and call them from here.
   */
  const handleFileUpload = async (file) => {
    setUploadedFile(file)
    setExtractedData(null)
    setProcessing(true)
    setError(null)
    // setCurrentStep(2)

    try {
      const form = new FormData();
      form.append('file', file);

      const resp = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/process?parse_then_extract=1`,
        { method: 'POST', body: form }
      );

      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || `Server error: ${resp.status}`);
      }

      setExtractedData(data.extractedData);
    } catch (e) {
      setError(e.message || 'Upload/processing failed');
    } finally {
      setProcessing(false);
    }
  }

  const handleReset = () => {
    setUploadedFile(null)
    setExtractedData(null)
    setProcessing(false)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 mt-5">
            LlamaIndex Insurance Document Processor
          </h1>
          {/* <p className="text-lg text-gray-600">
            Candidates must build the upload & extraction flow
          </p> */}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Document Upload
              </CardTitle>
              <CardDescription>
                Upload an insurance document (PDF, DOCX, PPTX) to extract structured data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUpload
                onFileUpload={handleFileUpload}
                disabled={processing}
                uploadedFile={uploadedFile}
              />

              {uploadedFile && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">{uploadedFile.name}</span>
                      <Badge variant="secondary">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    {!processing && (
                      <Button variant="outline" size="sm" onClick={handleReset}>
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Processing Error</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Extracted Data
              </CardTitle>
              <CardDescription>
                Structured information extracted from your insurance document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataDisplay
                extractedData={extractedData}
                loading={processing}
                error={error}
              />
            </CardContent>
          </Card>
        </div>

        {/* Technical Information */}
        {/* <Card className="mt-8">
          <CardHeader>
            <CardTitle>Assessment Overview (Feel free to keep this section in your submission)</CardTitle>
            <CardDescription>
              You are invited to accomplish the following tasks:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Frontend Implementation</h3>
                <p className="text-sm text-gray-600">
                  Drag-and-drop UI for file upload + structured presentation for extracted data
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Backend & Database</h3>
                <p className="text-sm text-gray-600">
                  Build API routes for upload & processing; persist results (DB optional but encouraged).
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">LlamaIndex Integration</h3>
                <p className="text-sm text-gray-600">
                  Use LlamaParse + LlamaExtract on the backend; return structured JSON.
                </p>
              </div>

            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}

export default App
