import React from 'react'
export default function DocumentUpload({ onFileUpload, disabled, uploadedFile }) {
  void onFileUpload; void disabled;

  return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm">
      {uploadedFile ? (
        <div>
          <div className="font-medium">Uploaded:</div>
          <div className="text-gray-700">{uploadedFile.name}</div>
        </div>
      ) : (
        <div className="text-gray-600">
          <strong>TODO:</strong> Build the uploader (drag & drop + click, validation, progress).
        </div>
      )}
    </div>
  )
}
