import React, { useState } from 'react';
import NextImage from 'next/image';
import { ZoomIn, Image as ImageIcon } from 'lucide-react';
import BlockHeader from '@/components/ui/BlockHeader';

interface ImageCardProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  onClick?: () => void;
  priority?: boolean;
  isGallery?: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({
  src,
  alt,
  fallbackSrc,
  className,
  onClick,
  priority,
  isGallery = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Handle image load error - fallback to original if WebP fails
  const handleImageError = () => {
    if (!imageError && fallbackSrc && currentSrc !== fallbackSrc) {
      setImageError(true);
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <figure className={`group ${className || 'my-8'}`}>
      <div className="bg-[#0a0f14] print:bg-transparent border border-gray-800 print:border-none rounded-lg overflow-hidden h-full flex flex-col shadow-xl print:shadow-none relative z-[41]">
        <div className="absolute top-0 left-0 right-0 z-20">
          <BlockHeader
            title={alt || 'Image'}
            icon={ImageIcon}
            className="!bg-gray-900/90 backdrop-blur-sm border-none !h-8"
            rightElement={
              onClick && (
                <button
                  className="bg-gray-800/80 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700/50 flex items-center gap-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onClick) onClick();
                  }}
                >
                  <ZoomIn size={12} />
                  <span>Zoom</span>
                </button>
              )
            }
          />
        </div>
        <div
          className={`relative w-full overflow-hidden ${
            isGallery ? 'h-full flex-1' : 'aspect-video'
          } ${onClick ? 'cursor-zoom-in' : ''}`}
          onClick={onClick}
        >
          <NextImage
            src={currentSrc}
            alt={alt || ''}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
            onError={handleImageError}
            priority={priority}
          />
        </div>
      </div>
    </figure>
  );
};

export default ImageCard;
