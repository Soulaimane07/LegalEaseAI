import React, { useState } from "react";
import { auth } from "../../redux/slices/firebase";
import { API_BASE_URL } from "../../components/variables";

function PostPDF() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      alert("Please select a PDF file");
      return;
    }

    setFile(selectedFile);
  };

  const postPDF = async () => {
    if (!file) {
      alert("Please select a PDF file");
      return;
    }

    try {
      setLoading(true);

      const user = auth.currentUser;

      if (!user) {
        alert("You must be logged in");
        return;
      }

      const token = await user.getIdToken();

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE_URL}/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setUploadResult(data);

      console.log("Upload success:", data);

      /*
        Expected response:

        {
          status: "success",
          document_id: "...",
          filename: "contract.pdf"
        }

        Save document_id later for:
        - Analysis
        - RAG
        - Chat with document
      */
    } catch (error) {
      console.error(error);
      alert(error.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg p-6 border rounded-xl shadow-sm bg-white">
      <h2 className="text-xl font-semibold mb-4">
        Upload Legal Document
      </h2>

      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="mb-4"
      />

      {file && (
        <div className="mb-4 text-sm text-gray-600">
          Selected file: <strong>{file.name}</strong>
        </div>
      )}

      <button
        onClick={postPDF}
        disabled={loading || !file}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload PDF"}
      </button>

      {uploadResult && (
        <div className="mt-6 p-4 border rounded bg-green-50">
          <p className="font-medium text-green-700">
            Upload Successful
          </p>

          <p>
            <strong>Document ID:</strong>{" "}
            {uploadResult.document_id}
          </p>

          <p>
            <strong>Filename:</strong>{" "}
            {uploadResult.filename}
          </p>
        </div>
      )}
    </div>
  );
}

export default PostPDF;