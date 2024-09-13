import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { AiOutlineCloudUpload, AiOutlineDownload, AiOutlineFilePdf, AiOutlineLoading } from 'react-icons/ai';
import { BsFileText } from 'react-icons/bs';

const PdfMerger = () => {
  const [files, setFiles] = useState([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // Add state for loading
  const fileInputRef = useRef(null); // Reference to the file input

  const MAX_FILES = 100; // Set the maximum number of files allowed

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    // Check if all selected files are PDFs
    if (selectedFiles.some(file => file.type !== 'application/pdf')) {
      setErrorMessage('All files must be PDFs.');
      return;
    }

    // Check if adding the selected files would exceed the limit
    if (files.length + selectedFiles.length > MAX_FILES) {
      setErrorMessage(`You can only upload up to ${MAX_FILES} files.`);
      return;
    }

    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    setErrorMessage(null);
  };

  const handleMergeFiles = async () => {
    if (files.length < 2) {
      setErrorMessage('Please select at least two PDF files to merge.');
      return;
    }

    setIsProcessing(true); // Start processing

    try {
      const mergedPdf = await PDFDocument.create();
      const readFileAsArrayBuffer = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
      };

      for (let file of files) {
        try {
          const arrayBuffer = await readFileAsArrayBuffer(file);
          const pdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

          copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
          });
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          setErrorMessage(`Error processing file ${file.name}. It may be corrupted or invalid.`);
          setIsProcessing(false); // Stop processing
          return;
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setMergedPdfUrl(url);
      setErrorMessage(null);
    } catch (error) {
      console.error('Merge error:', error);
      setErrorMessage('An error occurred while merging the PDFs.');
    } finally {
      setIsProcessing(false); // Stop processing
    }
  };

  const handleClearFiles = () => {
    setFiles([]);
    setMergedPdfUrl(null);
    setErrorMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input field
    }
  };

  return (
    <div className="min-h-screen w-full max-w-lg bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
        <AiOutlineFilePdf className="text-red-500 text-3xl mr-2" />
        Merge PDFs
      </h2>
      
      <input
        type="file"
        accept="application/pdf"
        multiple
        onChange={handleFileChange}
        className="block w-full text-gray-700 border border-gray-300 rounded-lg p-2 mb-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        ref={fileInputRef} // Attach the reference to the input
      />
      
      <p className="text-gray-600 mb-4 flex items-center">
        <AiOutlineCloudUpload className="text-gray-500 text-xl mr-2" />
        Upload PDFs
      </p>

      {errorMessage && (
        <p className="text-red-600 font-medium mb-4 flex items-center">
          <BsFileText className="text-red-600 text-xl mr-2" />
          {errorMessage}
        </p>
      )}

      <button
        onClick={handleMergeFiles}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors mb-4"
        disabled={isProcessing} // Disable button while processing
      >
        {isProcessing ? (
          <span className="flex items-center">
            <AiOutlineLoading className="animate-spin text-white text-xl mr-2" />
            Processing...
          </span>
        ) : (
          'Merge PDFs'
        )}
      </button>

      {files.length > 0 && (
        <div className="mb-4">
          <p className="text-gray-700 mb-2">Selected Files:</p>
          <ul className="list-disc pl-5 mb-4">
            {files.map((file, index) => (
              <li key={index} className="text-gray-700">{file.name}</li>
            ))}
          </ul>
          <button
            onClick={handleClearFiles}
            className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
          >
            Clear Files
          </button>
        </div>
      )}

      {mergedPdfUrl && (
        <div>
          <a
            href={mergedPdfUrl}
            download="merged.pdf"
            className="text-blue-600 underline hover:text-blue-800 transition-colors flex items-center mb-4"
          >
            <AiOutlineDownload className="text-blue-500 text-xl mr-2" />
            Download Merged PDF
          </a>
          <iframe
            src={mergedPdfUrl}
            width="100%"
            height="500px"
            title="Merged PDF Preview"
            className="my-4 border border-gray-300 rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default PdfMerger
