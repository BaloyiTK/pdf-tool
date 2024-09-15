import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { AiOutlineCloudUpload, AiOutlineFilePdf, AiOutlineDownload } from 'react-icons/ai';
import { MdClear } from 'react-icons/md';

const PdfExtractor = () => {
  const [pdfDocument, setPdfDocument] = useState(null);
  const [splitPdfUrls, setSplitPdfUrls] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [splitRange, setSplitRange] = useState({ start: '', end: '' });
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleUploadFiles = async (event) => {
    const files = Array.from(event.target.files);

    if (files.some(file => file.type !== 'application/pdf')) {
      setErrorMessage('All files must be PDFs.');
      return;
    }

    try {
      const filePreviews = await Promise.all(files.map(async (file) => {
        const fileUrl = URL.createObjectURL(file);
        return { name: file.name, url: fileUrl };
      }));

      setUploadedFiles((prevFiles) => [...prevFiles, ...filePreviews]);
      setErrorMessage(null);
      if (files.length === 1) {
        const arrayBuffer = await files[0].arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        setPdfDocument(pdf);
      }
    } catch (error) {
      setErrorMessage('An error occurred while processing the files.');
      console.error(error);
    }
  };

  const handleSplitFile = async () => {
    if (!pdfDocument) {
      setErrorMessage('Please upload a PDF file first.');
      return;
    }

    try {
      const totalPages = pdfDocument.getPageCount();
      const splitUrls = [];
      const { start, end } = splitRange;
      const startPage = parseInt(start, 10);
      const endPage = parseInt(end, 10);

      if (isNaN(startPage) || isNaN(endPage) || startPage < 1 || endPage < startPage) {
        setErrorMessage('Invalid page range specified.');
        return;
      }

      if (startPage > totalPages || endPage > totalPages) {
        setErrorMessage('Page range exceeds total number of pages.');
        return;
      }

      // Create a single PDF containing the range of pages
      const newPdf = await PDFDocument.create();
      for (let i = startPage - 1; i < endPage; i++) {
        const [page] = await newPdf.copyPages(pdfDocument, [i]);
        newPdf.addPage(page);
      }

      const newPdfBytes = await newPdf.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      splitUrls.push(url);

      setSplitPdfUrls(splitUrls);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('An error occurred while splitting the PDF.');
      console.error(error);
    }
  };

  const handleRangeChange = (e) => {
    const { name, value } = e.target;
    setSplitRange((prevRange) => ({ ...prevRange, [name]: value }));
  };

  const clearPdfs = () => {
    setSplitPdfUrls([]);
    setUploadedFiles([]);
    setErrorMessage(null);
    setSplitRange({ start: '', end: '' });
  };

  return (
    <div className="min-h-screen w-full max-w-lg bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
        <AiOutlineFilePdf className="text-red-500 text-3xl mr-2" />
        Split PDF
      </h2>

      <input
        type="file"
        accept="application/pdf"
        onChange={handleUploadFiles}
        className="block w-full text-gray-700 border border-gray-300 rounded-lg p-2 mb-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="mb-4">
        <label className="block text-gray-600 mb-2 flex items-center">
          <AiOutlineFilePdf className="text-gray-500 text-xl mr-2" />
          Page Range
        </label>
        <input
          type="number"
          name="start"
          value={splitRange.start}
          onChange={handleRangeChange}
          placeholder="Start Page"
          className="block w-full text-gray-700 border border-gray-300 rounded-lg p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          name="end"
          value={splitRange.end}
          onChange={handleRangeChange}
          placeholder="End Page"
          className="block w-full text-gray-700 border border-gray-300 rounded-lg p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
          <h3 className="text-lg font-semibold text-gray-600 mb-2 flex items-center">
            <AiOutlineFilePdf className="text-gray-500 text-xl mr-2" />
            Split PDF Files:
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {splitPdfUrls.map((url, index) => (
              <div key={index}>
                <a
                  href={url}
                  download={`split-file-${index + 1}.pdf`}
                  className="text-blue-600 underline hover:text-blue-800 transition-colors flex items-center mb-4"
                >
                  <AiOutlineDownload className="text-blue-500 text-xl mr-2" />
                  Download File {index + 1}
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
            Uploaded Files
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="border border-gray-300 rounded-lg p-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{file.name}</h3>
                <iframe
                  src={file.url}
                  width="100%"
                  height="200px"
                  title={`Uploaded File ${index + 1}`}
                  className="border border-gray-300 rounded-lg"
                />
              </div>
            ))}
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

export default PdfExtractor;
