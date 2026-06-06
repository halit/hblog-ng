export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
      {/* Header skeleton */}
      <div className="h-3 w-24 bg-gray-800 rounded mb-8" />
      <div className="h-8 w-3/4 bg-gray-800 rounded mb-4" />
      <div className="h-4 w-1/2 bg-gray-800 rounded mb-2" />
      <div className="h-4 w-1/3 bg-gray-800 rounded mb-10" />
      {/* Content skeleton */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-800 rounded mb-3"
          style={{ width: `${75 + (i % 3) * 8}%` }}
        />
      ))}
    </div>
  );
}
