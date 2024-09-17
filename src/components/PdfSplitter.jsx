import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { AiOutlineFilePdf, AiOutlineDownload } from 'react-icons/ai';
import { MdClear } from 'react-icons/md';

const PdfSplitter = () => {
  const [pdfDocument, setPdfDocument] = useState(null);
  const [splitPdfUrls, setSplitPdfUrls] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleUploadFile = async (file) => {
    if (file.type !== 'application/pdf') {
      setErrorMessage('The file must be a PDF.');
      return;
    }

    try {
      const fileUrl = URL.createObjectURL(file);
      setUploadedFiles([{ name: file.name, url: fileUrl }]);
      setErrorMessage(null);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      setPdfDocument(pdf);
    } catch (error) {
      setErrorMessage('An error occurred while processing the file.');
      console.error(error);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      handleUploadFile(files[0]);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleSplitFile = async () => {
    if (!pdfDocument) {
      setErrorMessage('Please upload a PDF file first.');
      return;
    }

    try {
      const totalPages = pdfDocument.getPageCount();
      const splitUrls = [];

      // Create separate PDFs for each page
      for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdfDocument, [i]);
        newPdf.addPage(page);

        const newPdfBytes = await newPdf.save();
        const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        splitUrls.push({ url, name: `split-file-${i + 1}.pdf` });
      }

      setSplitPdfUrls(splitUrls);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('An error occurred while splitting the PDF.');
      console.error(error);
    }
  };

  const handleDownloadAll = async () => {
    try {
      const zip = new JSZip();

      for (const { url, name } of splitPdfUrls) {
        const response = await fetch(url);
        const blob = await response.blob();
        zip.file(name, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);

      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = 'split-pages.zip';
      a.click();

      // Clean up the URL object
      URL.revokeObjectURL(zipUrl);
    } catch (error) {
      setErrorMessage('An error occurred while creating the ZIP file.');
      console.error(error);
    }
  };

  const clearPdfs = () => {
    setSplitPdfUrls([]);
    setUploadedFiles([]);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full max-w-lg bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
        <AiOutlineFilePdf className="text-red-500 text-3xl mr-2" />
        Split PDF
      </h2>

      <div
        className={`border-2 border-dashed border-gray-300 p-4 mb-4 rounded-lg ${isDragOver ? 'bg-gray-100' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <p className="text-gray-600 text-center">
          <AiOutlineFilePdf className="text-gray-500 text-3xl mb-2" />
          <br />
          Drag and drop a PDF file here or click to upload
        </p>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => handleUploadFile(e.target.files[0])}
          className="hidden"
          id="fileInput"
        />
        <label htmlFor="fileInput" className="cursor-pointer text-blue-500 underline text-center block mt-2">
          Browse File
        </label>
      </div>

      <button
        onClick={handleSplitFile}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-600 transition-colors flex items-center"
      >
        <AiOutlineFilePdf className="text-red-500 text-xl mr-2" />
        Split PDF
      </button>

      {errorMessage && (
        <p className="text-red-600 font-medium mt-4 flex items-center">
          <AiOutlineFilePdf className="text-red-600 text-xl mr-2" />
          {errorMessage}
        </p>
      )}

      {splitPdfUrls.length > 0 && (
        <div className="mt-6">
          <button
            onClick={handleDownloadAll}
            className="bg-green-500 text-white py-2 px-4 rounded-lg shadow hover:bg-green-600 transition-colors flex items-center mb-4"
          >
            <AiOutlineDownload className="text-white text-xl mr-2" />
            Download All as ZIP
          </button>

          <h3 className="text-lg font-semibold text-gray-600 mb-2 flex items-center">
            <AiOutlineFilePdf className="text-gray-500 text-xl mr-2" />
            Split PDF Files:
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {splitPdfUrls.map(({ url, name }, index) => (
              <div key={index}>
                <a
                  href={url}
                  download={name}
                  className="text-blue-600 underline hover:text-blue-800 transition-colors flex items-center mb-4"
                >
                  <AiOutlineDownload className="text-blue-500 text-xl mr-2" />
                  Download {name}
                </a>
                <iframe
                  src={url}
                  width="100%"
                  height="300px"
                  title={`PDF File ${index + 1}`}
                  className="my-4 border border-gray-300 rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
            <AiOutlineFilePdf className="text-red-500 text-3xl mr-2" />
            Uploaded File
          </h2>
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{uploadedFiles[0].name}</h3>
            <iframe
              src={uploadedFiles[0].url}
              width="100%"
              height="200px"
              title={`Uploaded File`}
              className="border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      )}

      {(splitPdfUrls.length > 0 || uploadedFiles.length > 0) && (
        <button
          onClick={clearPdfs}
          className="bg-red-500 text-white py-2 px-4 rounded-lg shadow hover:bg-red-600 transition-colors flex items-center"
        >
          <MdClear className="text-white text-xl mr-2" />
          Clear
        </button>
      )}
    </div>
  );
};

export default PdfSplitter;
