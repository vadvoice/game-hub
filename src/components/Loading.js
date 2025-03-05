export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center h-full w-full bg-gray-800 bg-opacity-80">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">{message}</p>
      </div>
    </div>
  );
} 