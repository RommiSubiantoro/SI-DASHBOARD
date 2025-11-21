import React from "react";

const PaginationControls = ({ currentPage, totalPages, onPrev, onNext, disabled }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-200 gap-2 sm:gap-0">
      {/* Tombol Prev */}
      <button
        onClick={onPrev}
        disabled={currentPage === 1 || disabled}
        className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 w-full sm:w-auto"
      >
        &lt; Prev
      </button>

      {/* Halaman */}
      <span className="text-sm text-gray-600">
        Halaman {currentPage} dari {totalPages}
      </span>

      {/* Tombol Next */}
      <button
        onClick={onNext}
        disabled={currentPage === totalPages || disabled}
        className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 w-full sm:w-auto"
      >
        Next &gt;
      </button>
    </div>
  );
};


export default PaginationControls;
