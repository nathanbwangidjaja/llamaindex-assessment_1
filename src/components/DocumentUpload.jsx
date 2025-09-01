import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card } from '@/components/ui/card.jsx'
import { Upload, FileText, X } from 'lucide-react'

const DocumentUpload = ({ onFileUpload, disabled, uploadedFile }) => {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      validateAndUpload(file)
    }
  }, [disabled])

  const handleFileSelect = useCallback((e) => {
    if (disabled) return
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      validateAndUpload(file)
    }
  }, [disabled])

  const validateAndUpload = (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, DOCX, or PPTX file.')
      return
    }
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size must be less than 10MB.')
      return
    }

    onFileUpload(file)
  }

  if (uploadedFile) {
    return (
      <Card className="p-6 border-2 border-green-200 bg-green-50">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">File Uploaded Successfully</h3>
            <p className="text-green-600 mb-4">{uploadedFile.name}</p>
            {disabled && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div>
      {/* <div className="rounded-lg border p-6 text-sm text-gray-700 mb-5">
        <strong>TODO:</strong> Implement "/api/process" for file processing.
      </div> */}

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept=".pdf,.docx,.pptx"
          onChange={handleFileSelect}
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {dragActive ? 'Drop your file here' : 'Upload Insurance Document'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            Drag and drop your file here, or click to browse
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">PDF</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">DOCX</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">PPTX</span>
          </div>
          
          <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
          
          <Button 
            variant="outline" 
            className="mt-4"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation()
              document.getElementById('file-input').click()
            }}
          >
            Choose File
          </Button>
        </div>
      </div>

    </div>
  )
}

export default DocumentUpload
