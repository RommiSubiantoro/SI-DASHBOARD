const LoadingSpinner = ({ message = "Memuat data..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px] py-6 px-4 text-gray-500">
      {/* Spinner */}
      <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-b-4 border-transparent mb-4"></div>

      {/* Teks */}
      <p className="text-sm sm:text-base text-center">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
