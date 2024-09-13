// src/components/PdfToWord.js
import { useState } from "react";
import { AiOutlineUpload, AiOutlineDownload } from "react-icons/ai";

const PdfToWord = () => {
  const [file, setFile] = useState(null);
  const [convertedFileUrl, setConvertedFileUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setConvertedFileUrl(null);
  };

  const handleConvert = async () => {
    if (!file) {
      setErrorMessage("Please upload a PDF file first.");
      return;
    }

    try {
      // Example: This is a placeholder for actual conversion logic
      // In a real scenario, you would call an API or use a library to convert PDF to Word
      setErrorMessage(null);

      // For demonstration, we're just creating a dummy Word file
      const blob = new Blob(
        [`This is a dummy Word file generated from ${file.name}`],
        { type: "application/msword" }
      );
      const url = URL.createObjectURL(blob);

      setConvertedFileUrl(url);
    } catch (error) {
      setErrorMessage("An error occurred while converting the PDF.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-lg bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
        <AiOutlineFileWord className="text-blue-500 text-3xl mr-2" />
        Convert PDF to Word
      </h2>

      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="block w-full text-gray-700 border border-gray-300 rounded-lg p-2 mb-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        onClick={handleConvert}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-600 transition-colors flex items-center"
      >
        <AiOutlineUpload className="text-white text-xl mr-2" />
        Convert to Word
      </button>

      {errorMessage && (
        <p className="text-red-600 font-medium mt-4 flex items-center">
          <AiOutlineUpload className="text-red-600 text-xl mr-2" />
          {errorMessage}
        </p>
      )}

      {convertedFileUrl && (
        <div className="mt-6">
          <a
            href={convertedFileUrl}
            download="converted.docx"
            className="text-blue-600 underline hover:text-blue-800 transition-colors flex items-center mb-4"
          >
            <AiOutlineDownload className="text-blue-500 text-xl mr-2" />
            Download Word Document
          </a>
        </div>
      )}
    </div>
  );
};

export default PdfToWord;
