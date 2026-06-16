import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { X } from 'lucide-react';
import ImageCard from '@/components/content/ImageCard';

interface ImageWithZoomProps {
  src: string;
  alt: string;
  index?: number;
  fallbackSrc?: string;
  className?: string;
  scale?: number;
}

// Image component with zoom functionality
const ImageWithZoom: React.FC<ImageWithZoomProps> = ({
  src,
  alt,
  fallbackSrc,
  className,
  scale,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Handle Escape key to close zoom
  useEffect(() => {
    if (!isZoomed) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZoomed(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isZoomed]);

  // Handle image load error - fallback to original if WebP fails
  const handleImageError = () => {
    if (!imageError && fallbackSrc && currentSrc !== fallbackSrc) {
      setImageError(true);
      setCurrentSrc(fallbackSrc);
    }
  };

  const containerStyle =
    scale && isZoomed
      ? {
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease-out',
        }
      : undefined;

  return (
    <>
      <ImageCard
        src={src}
        alt={alt}
        fallbackSrc={fallbackSrc}
        className={className}
        onClick={() => setIsZoomed(true)}
      />

      {/* Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(false);
              }}
              className="absolute top-4 right-4 z-10 bg-gray-900 hover:bg-gray-800 text-white p-2 rounded border border-gray-700 transition-colors"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
            <div style={containerStyle} className="w-full h-full relative">
              <NextImage
                src={currentSrc}
                alt={alt || ''}
                fill
                className="object-contain"
                unoptimized
                onError={handleImageError}
              />
            </div>
            {alt && (
              <div className="absolute bottom-4 left-4 right-4 bg-gray-900/90 backdrop-blur-sm text-white px-4 py-2 rounded text-sm font-mono border border-gray-700 max-w-3xl mx-auto text-center">
                {alt}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageWithZoom;
