import React from 'react'

export default function DataDisplay({ extractedData, loading, error }) {
  void extractedData; void loading; void error;

  return (
    <div className="rounded-lg border p-6 text-sm text-gray-700">
      <strong>TODO:</strong> Implement the full results UI here:
      loading, error, and structured sections for the extracted data.
    </div>
  )
}
