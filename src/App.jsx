import { useState } from "react";
import { AiOutlineMergeCells, AiOutlineSplitCells, AiOutlineFileSearch } from "react-icons/ai";
import PdfMerger from "./components/PdfMerger";
import PdfSplitter from "./components/PdfSplitter";
import PdfExtractor from "./components/PdfExtractor";
import "./index.css"; // Ensure Tailwind CSS is included

function App() {
  const [activeComponent, setActiveComponent] = useState(null);

  const handleCardClick = (component) => {
    setActiveComponent((prev) => (prev === component ? null : component));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="sticky top-0 bg-white shadow-md p-4 z-50">
        <div className="container mx-auto flex items-center justify-between px-4">
          {/* Logo can be added here */}
          {/* <img src={logo} alt="Logo" className="h-8"/> */}
          <div className="flex items-center space-x-4 text-2xl font-bold">
            <AiOutlineFileSearch className="text-6xl text-red-600" />
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center">
                <span className="text-red-600 text-lg sm:text-xl md:text-2xl">PDF</span>
                <span className="text-4xl font-extrabold italic text-blue-800">
                  Pulse
                </span>
              </div>
              <span className="text-sm text-gray-500 mt-1">
                powered by{" "}
                <span className="font-semibold text-gray-700">
                  Ikusasa Technology Solutions
                </span>
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center flex-grow p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap justify-center gap-6">
          <div
            className={`w-full sm:w-80 p-6 rounded-lg shadow-lg bg-white transition-transform transform hover:scale-105 cursor-pointer ${
              activeComponent === "merger" ? "border-2 border-blue-600" : ""
            }`}
            onClick={() => handleCardClick("merger")}
            aria-selected={activeComponent === "merger"}
            role="button"
          >
            <div className="flex items-center mb-2">
              <AiOutlineMergeCells className="text-orange-600 text-3xl mr-2" />
              <h2 className="text-xl font-semibold">PDF Merger</h2>
            </div>
            <p className="text-gray-700">
              Merge multiple PDF files into a single document.
            </p>
          </div>

          <div
            className={`w-full sm:w-80 p-6 rounded-lg shadow-lg bg-white transition-transform transform hover:scale-105 cursor-pointer ${
              activeComponent === "splitter" ? "border-2 border-blue-600" : ""
            }`}
            onClick={() => handleCardClick("splitter")}
            aria-selected={activeComponent === "splitter"}
            role="button"
          >
            <div className="flex items-center mb-2">
              <AiOutlineSplitCells className="text-green-600 text-3xl mr-2" />
              <h2 className="text-xl font-semibold">PDF Splitter</h2>
            </div>
            <p className="text-gray-700">
              Split a PDF file into multiple documents.
            </p>
          </div>

          <div
            className={`w-full sm:w-80 p-6 rounded-lg shadow-lg bg-white transition-transform transform hover:scale-105 cursor-pointer ${
              activeComponent === "extractor" ? "border-2 border-blue-600" : ""
            }`}
            onClick={() => handleCardClick("extractor")}
            aria-selected={activeComponent === "extractor"}
            role="button"
          >
            <div className="flex items-center mb-2">
              <AiOutlineFileSearch className="text-blue-600 text-3xl mr-2" />
              <h2 className="text-xl font-semibold">PDF Extractor</h2>
            </div>
            <p className="text-gray-700">
              Extract specific pages from a PDF document.
            </p>
          </div>
        </div>

        {/* Conditional Rendering */}
        {activeComponent === "merger" && <PdfMerger />}
        {activeComponent === "splitter" && <PdfSplitter />}
        {activeComponent === "extractor" && <PdfExtractor />}
      </main>
    </div>
  );
}

export default App;
