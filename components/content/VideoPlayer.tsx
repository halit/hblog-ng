import React, { useEffect, useRef, useMemo } from 'react';
import { Video, Terminal } from 'lucide-react';
import BlockHeader from '@/components/ui/BlockHeader';
import { getVideoInfo } from '@/utils/video';
import 'asciinema-player/dist/bundle/asciinema-player.css';

interface VideoPlayerProps {
  src: string;
  caption?: string;
  height?: string;
}

interface AsciinemaPlayerInstance {
  dispose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, caption, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<AsciinemaPlayerInstance | null>(null);

  const { type, embedUrl } = useMemo(() => getVideoInfo(src), [src]);
  const isAsciinema = type === 'asciinema';
  const isExternal = type === 'youtube' || type === 'vimeo';

  // Handle Asciinema Player initialization
  useEffect(() => {
    let isMounted = true;

    if (isAsciinema && containerRef.current && typeof window !== 'undefined') {
      // Clean up previous instance if exists
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }

      // Dynamically import to avoid SSR issues and reduce initial bundle
      import('asciinema-player')
        .then((AsciinemaPlayer) => {
          if (!isMounted || !containerRef.current) return;

          // Clear previous content if any
          containerRef.current.innerHTML = '';

          try {
            const player = AsciinemaPlayer.create(embedUrl, containerRef.current, {
              fit: 'width', // Always fit width
              theme: 'dracula',
              preload: true,
              controls: true,
              poster: 'npt:0:01', // Show first second as poster/thumbnail
            });
            playerRef.current = player as AsciinemaPlayerInstance;
          } catch (e) {
            console.error('Failed to create asciinema player:', e);
          }
        })
        .catch((err) => console.error('Failed to load asciinema-player module', err));

      return () => {
        isMounted = false;
        if (playerRef.current) {
          playerRef.current.dispose();
          playerRef.current = null;
        }
        // containerRef.current might be null if component unmounted
      };
    }
  }, [embedUrl, isAsciinema]);

  if (isAsciinema) {
    // Apply height if specified, but allow it to grow/shrink as needed if using fit: width
    const containerStyle = height ? { height, minHeight: height } : {};
    const containerClass = `w-full ${height ? 'overflow-hidden' : ''}`;

    return (
      <figure className="my-4 group print:hidden">
        <div className="bg-[#0a0f14] border border-gray-800 rounded-lg overflow-hidden shadow-xl relative z-[41]">
          <BlockHeader title={caption || 'Terminal Session'} icon={Terminal} />
          <div ref={containerRef} className={containerClass} style={containerStyle} />
        </div>
      </figure>
    );
  }

  return (
    <figure className="my-4 group print:hidden">
      <div className="bg-[#0a0f14] border border-gray-800 rounded-lg overflow-hidden shadow-xl relative z-[41]">
        {/* Header - Use overlay for local video, separate for external */}
        {!isExternal ? (
          <>
            <div className="absolute top-0 left-0 right-0 z-20">
              <BlockHeader
                title={caption || 'Video'}
                icon={Video}
                className="!bg-gray-900/90 backdrop-blur-sm border-none !h-8"
              />
            </div>
            <div className="w-full bg-black">
              <video
                src={embedUrl}
                controls
                className="w-full h-auto max-h-[75vh] block object-contain"
                preload="metadata"
              >
                <source src={embedUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </>
        ) : (
          <>
            <BlockHeader title={caption || 'Video'} icon={Video} />
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={embedUrl}
                className="absolute top-0 left-0 w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={caption || 'Video player'}
              />
            </div>
          </>
        )}
      </div>
    </figure>
  );
};

export default VideoPlayer;
