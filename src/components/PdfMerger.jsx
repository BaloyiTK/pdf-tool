import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { AiOutlineCloudUpload, AiOutlineDownload, AiOutlineFilePdf, AiOutlineLoading, AiOutlineDelete } from 'react-icons/ai';
import { BsFileText } from 'react-icons/bs';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Component for draggable file list item
const DraggableFileItem = ({ file, index, moveFile, removeFile, hasError }) => {
  const [, ref] = useDrag({
    type: 'FILE',
    item: { index },
  });

  const [, drop] = useDrop({
    accept: 'FILE',
    hover(item) {
      if (item.index === index) return;
      moveFile(item.index, index);
      item.index = index;
    },
  });

  return (
    <div
      ref={(node) => ref(drop(node))}
      className={`flex items-center border-b border-gray-300 pb-2 mb-2 ${hasError ? 'bg-red-100' : ''}`}
    >
      <span className="mr-4 text-gray-700">File {index + 1}:</span>
      <span className="flex-1">{file.name}</span>
      {hasError && (
        <span className="text-red-600 ml-4 text-sm">Error</span>
      )}
      <button
        onClick={() => removeFile(index)}
        className="text-red-500 ml-4 hover:text-red-900"
      >
        <AiOutlineDelete />
      </button>
    </div>
  );
};

const PdfMerger = () => {
  const [files, setFiles] = useState([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
  const [errorMessages, setErrorMessages] = useState([]); // Handle errors per file
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const mergedPdfRef = useRef(null); // Reference for scrolling

  const MAX_FILES = 100;

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    if (selectedFiles.some(file => file.type !== 'application/pdf')) {
      setErrorMessages(['All files must be PDFs.']);
      return;
    }

    if (files.length + selectedFiles.length > MAX_FILES) {
      setErrorMessages([`You can only upload up to ${MAX_FILES} files.`]);
      return;
    }

    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    setErrorMessages([]); // Clear errors when new files are added
  };

  const handleMergeFiles = async () => {
    if (files.length < 2) {
      setErrorMessages(['Please select at least two PDF files to merge.']);
      return;
    }

    setIsProcessing(true);
    setErrorMessages([]); // Clear errors before starting the merge

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

      const fileErrors = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const arrayBuffer = await readFileAsArrayBuffer(file);
          const pdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach(page => mergedPdf.addPage(page));
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          fileErrors.push({ index: i + 1, name: file.name, error: `Error processing file ${i + 1}: ${file.name}. It may be corrupted or invalid.` });
        }
      }

      if (fileErrors.length > 0) {
        setErrorMessages(fileErrors);
      } else {
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        setMergedPdfUrl(url);
        setErrorMessages([]);
        
        // Ensure the scroll occurs after the state update
        setTimeout(() => {
          if (mergedPdfRef.current) {
            mergedPdfRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 0); // Delay to ensure the DOM has updated
      }
    } catch (error) {
      console.error('Merge error:', error);
      setErrorMessages([{ error: 'An error occurred while merging the PDFs.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearFiles = () => {
    setFiles([]);
    setMergedPdfUrl(null);
    setErrorMessages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    // Clear specific error for the removed file
    setErrorMessages(prevErrors => prevErrors.filter(error => error.index !== index + 1));
  };

  const moveFile = (fromIndex, toIndex) => {
    const updatedFiles = [...files];
    const [movedFile] = updatedFiles.splice(fromIndex, 1);
    updatedFiles.splice(toIndex, 0, movedFile);
    setFiles(updatedFiles);
  };

  return (
    <DndProvider backend={HTML5Backend}>
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
          ref={fileInputRef}
        />
        
        <p className="text-gray-600 mb-4 flex items-center">
          <AiOutlineCloudUpload className="text-gray-500 text-xl mr-2" />
          Upload PDFs
        </p>

        {errorMessages.length > 0 && (
          <div className="text-red-600 font-medium mb-4">
            {errorMessages.map((error, index) => (
              <p key={index} className="flex items-center mb-2">
                <BsFileText className="text-red-600 text-xl mr-2" />
                {error.error || error}
              </p>
            ))}
          </div>
        )}

        <button
          onClick={handleMergeFiles}
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors mb-4"
          disabled={isProcessing}
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
            <div className="space-y-2">
              {files.map((file, index) => (
                <DraggableFileItem
                  key={index}
                  file={file}
                  index={index}
                  moveFile={moveFile}
                  removeFile={handleRemoveFile}
                  hasError={errorMessages.some(e => e.index === index + 1)}
                />
              ))}
            </div>
            <button
              onClick={handleClearFiles}
              className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
            >
              Clear Files
            </button>
          </div>
        )}

        {mergedPdfUrl && (
          <div ref={mergedPdfRef}>
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
    </DndProvider>
  );
};

export default PdfMerger;
