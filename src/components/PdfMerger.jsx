import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import {
  AiOutlineCloudUpload,
  AiOutlineDownload,
  AiOutlineFilePdf,
  AiOutlineLoading,
  AiOutlineDelete,
  AiOutlineDrag,
} from "react-icons/ai";
import { BsFileText } from "react-icons/bs";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// DraggableFileItem Component
// eslint-disable-next-line react/prop-types
const DraggableFileItem = ({ file, index, moveFile, removeFile, hasError }) => {
  const [{ isDragging }, ref] = useDrag({
    type: "FILE",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "FILE",
    hover(item) {
      if (item.index === index) return;
      moveFile(item.index, index);
      item.index = index;
    },
  });

  return (
    <div
      ref={(node) => ref(drop(node))}
      className={`flex items-center border-b border-gray-300 pb-2 mb-2 ${
        hasError ? "bg-red-100" : ""
      } ${isDragging ? "bg-gray-200" : ""}`}
    >
      <AiOutlineDrag className="text-gray-500 text-xl mr-4 cursor-move" />
      <span className="mr-4 text-gray-700">File {index + 1}:</span>
      <div className="flex-1 overflow-hidden whitespace-nowrap">
        <span className="truncate" style={{ maxWidth: "calc(100% - 100px)" }}>
          {file.name.length > 45
            ? `${file.name.substring(0, 42)}...`
            : file.name}
        </span>
      </div>
      {hasError && <span className="text-red-600 ml-4 text-sm">Error</span>}
      <button
        onClick={() => removeFile(index)}
        className="text-red-500 ml-4 hover:text-red-900"
        // eslint-disable-next-line react/prop-types
        aria-label={`Remove ${file.name}`}
      >
        <AiOutlineDelete />
      </button>
    </div>
  );
};

const PdfMerger = () => {
  const [files, setFiles] = useState([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
  const [errorMessages, setErrorMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState("merged.pdf");
  const fileInputRef = useRef(null);
  const mergedPdfRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const MAX_FILES = 100;
  const MAX_FILE_SIZE_MB = 100; // Example size limit: 10 MB

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    // File type validation
    if (selectedFiles.some((file) => file.type !== "application/pdf")) {
      setErrorMessages(["All files must be PDFs."]);
      return;
    }

    // File size validation
    if (
      selectedFiles.some((file) => file.size > MAX_FILE_SIZE_MB * 1024 * 1024)
    ) {
      setErrorMessages(["Some files exceed the maximum allowed size."]);
      return;
    }

    // Total file count validation
    if (files.length + selectedFiles.length > MAX_FILES) {
      setErrorMessages([`You can only upload up to ${MAX_FILES} files.`]);
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    setErrorMessages([]);
  };

  const handleMergeFiles = async () => {
    if (files.length < 2) {
      setErrorMessages(["Please select at least two PDF files to merge."]);
      return;
    }

    setIsProcessing(true);
    setErrorMessages([]);

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
          const copiedPages = await mergedPdf.copyPages(
            pdf,
            pdf.getPageIndices()
          );
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          fileErrors.push({
            index: i + 1,
            name: file.name,
            error: `Error processing file ${i + 1}: ${
              file.name
            }. It may be corrupted or invalid.`,
          });
        }
      }

      if (fileErrors.length > 0) {
        setErrorMessages(fileErrors);
      } else {
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        setMergedPdfUrl(url);
        setErrorMessages([]);

        setTimeout(() => {
          if (mergedPdfRef.current) {
            mergedPdfRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 0);
      }
    } catch (error) {
      console.error("Merge error:", error);
      setErrorMessages([
        { error: "An error occurred while merging the PDFs." },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearFiles = () => {
    setFiles([]);
    setMergedPdfUrl(null);
    setErrorMessages([]);
    setFileName("merged.pdf");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setErrorMessages((prevErrors) =>
      prevErrors.filter((error) => error.index !== index + 1)
    );
  };

  const moveFile = (fromIndex, toIndex) => {
    const updatedFiles = [...files];
    const [movedFile] = updatedFiles.splice(fromIndex, 1);
    updatedFiles.splice(toIndex, 0, movedFile);
    setFiles(updatedFiles);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(event.dataTransfer.files);

    // File type validation
    if (droppedFiles.some((file) => file.type !== "application/pdf")) {
      setErrorMessages(["All files must be PDFs."]);
      return;
    }

    // File size validation
    if (
      droppedFiles.some((file) => file.size > MAX_FILE_SIZE_MB * 1024 * 1024)
    ) {
      setErrorMessages(["Some files exceed the maximum allowed size."]);
      return;
    }

    // Total file count validation
    if (files.length + droppedFiles.length > MAX_FILES) {
      setErrorMessages([`You can only upload up to ${MAX_FILES} files.`]);
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
    setErrorMessages([]);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen w-full max-w-lg bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
          <AiOutlineFilePdf className="text-red-500 text-3xl mr-2" />
          Merge PDFs
        </h2>

        <div
          className={`relative border-2 rounded-lg p-6 mb-4 text-center cursor-pointer ${
            isDragOver
              ? "border-blue-500 bg-blue-100"
              : "border-gray-300 bg-gray-50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          <div className="text-center">
            <p className="text-gray-700 whitespace-nowrap mb-2">
              {files.length === 0
                ? "Drag & drop files here or click to select files"
                : "Drag & drop more files or click to select additional files"}
            </p>
            <div className="flex justify-center">
              <AiOutlineCloudUpload className="text-3xl text-gray-500" />
            </div>
          </div>
        </div>

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

        {files.length > 0 && (
          <>
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
                "Merge PDFs"
              )}
            </button>

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
                    hasError={errorMessages.some((e) => e.index === index + 1)}
                  />
                ))}
              </div>
              <button
                onClick={handleClearFiles}
                className="bg-red-500 text-white py-2 px-4 rounded-lg mt-2 hover:bg-red-600 transition-colors"
              >
                Clear Files
              </button>
            </div>
          </>
        )}

        {mergedPdfUrl && (
          <div ref={mergedPdfRef}>
            <div className="mb-4">
              <label htmlFor="file-name" className="block text-gray-700 mb-2">
                File Name:
              </label>
              <input
                type="text"
                id="file-name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="block w-full text-gray-700 border border-gray-300 rounded-lg p-2 mb-4"
              />
            </div>
            <a
              href={mergedPdfUrl}
              download={fileName}
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
