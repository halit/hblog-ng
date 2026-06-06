import React, { useState, useEffect, useCallback } from 'react';
import NextImage from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import ImageCard from './ImageCard';

interface GalleryImage {
  src: string;
  alt: string;
  fallbackSrc?: string;
  scale?: number;
}

interface ImageGalleryProps {
  images: GalleryImage[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  // Reset error state when selected image changes
  useEffect(() => {
    if (selectedIndex !== null) {
      setCurrentSrc(images[selectedIndex].src);
      setImageError(false);
    }
  }, [selectedIndex, images]);

  const handleImageError = () => {
    if (selectedIndex === null) return;

    const image = images[selectedIndex];
    if (!imageError && image.fallbackSrc && currentSrc !== image.fallbackSrc) {
      setImageError(true);
      setCurrentSrc(image.fallbackSrc);
    }
  };

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (selectedIndex === null) return;
      setSelectedIndex((prev) => (prev === null || prev === images.length - 1 ? 0 : prev + 1));
    },
    [selectedIndex, images.length],
  );

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (selectedIndex === null) return;
      setSelectedIndex((prev) => (prev === null || prev === 0 ? images.length - 1 : prev - 1));
    },
    [selectedIndex, images.length],
  );

  // Handle keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIndex(null);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, handleNext, handlePrev]);

  if (!images || images.length === 0) return null;

  // Helper to render the grid based on count
  const renderGrid = () => {
    // 2 images: Split 1:1
    if (images.length === 2) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
          {images.map((img, idx) => (
            <ImageCard
              key={idx}
              {...img}
              className="my-0 h-64 md:h-80"
              onClick={() => setSelectedIndex(idx)}
              isGallery={true}
            />
          ))}
        </div>
      );
    }

    // 3+ images: 1 full width on desktop, 2 split below. Stacks vertically on mobile.
    if (images.length >= 3) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0 my-2">
          <ImageCard
            {...images[0]}
            className="md:col-span-2 my-0 h-64 md:h-[400px]"
            onClick={() => setSelectedIndex(0)}
            isGallery={true}
          />
          <ImageCard
            {...images[1]}
            className="my-0 h-64 md:h-72 md:-mt-3"
            onClick={() => setSelectedIndex(1)}
            isGallery={true}
          />
          <ImageCard
            {...images[2]}
            className="my-0 h-64 md:h-72 md:-mt-3"
            onClick={() => setSelectedIndex(2)}
            isGallery={true}
          />
        </div>
      );
    }

    // Fallback for 1 image
    return <ImageCard {...images[0]} onClick={() => setSelectedIndex(0)} />;
  };

  return (
    <>
      {renderGrid()}

      {/* Gallery Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedIndex(null)}
        >
          {/* Navigation Buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-gray-900/50 hover:bg-gray-800 text-white p-3 rounded-full border border-gray-700/50 hover:border-gray-500 transition-all backdrop-blur-sm group"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft size={32} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-gray-900/50 hover:bg-gray-800 text-white p-3 rounded-full border border-gray-700/50 hover:border-gray-500 transition-all backdrop-blur-sm group"
            title="Next (Right Arrow)"
          >
            <ChevronRight size={32} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(null);
              }}
              className="absolute top-4 right-4 z-20 bg-gray-900 hover:bg-gray-800 text-white p-2 rounded border border-gray-700 transition-colors"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>

            <div
              className="w-full h-full relative"
              style={
                images[selectedIndex].scale
                  ? {
                      width: `${images[selectedIndex].scale! * 100}%`,
                      height: `${images[selectedIndex].scale! * 100}%`,
                      position: 'relative',
                    }
                  : {}
              }
            >
              <NextImage
                src={currentSrc || images[selectedIndex].src}
                alt={images[selectedIndex].alt || ''}
                fill
                className="object-contain select-none"
                unoptimized
                priority
                onError={handleImageError}
              />
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none">
              {/* Counter */}
              <div className="bg-gray-900/80 backdrop-blur-sm text-gray-300 px-3 py-1 rounded-full text-xs font-mono border border-gray-700">
                {selectedIndex + 1} / {images.length}
              </div>

              {/* Caption */}
              {images[selectedIndex].alt && (
                <div className="bg-gray-900/90 backdrop-blur-sm text-white px-4 py-2 rounded text-sm font-mono border border-gray-700 max-w-3xl text-center pointer-events-auto">
                  {images[selectedIndex].alt}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;
