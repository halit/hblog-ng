'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileText, Image as ImageIcon, FileCode, Archive } from 'lucide-react';
import { formatBytes } from '../utils';

interface FileAttachmentProps {
  fileName: string;
  fileUrl: string;
  fileExt: string;
}

interface FileMetadata {
  size?: number;
  type?: string;
  lastModified?: string;
  dimensions?: string;
}

const FileAttachment: React.FC<FileAttachmentProps> = ({ fileName, fileUrl, fileExt }) => {
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [, setLoading] = useState(true);
  const [, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const fetchMetadata = async () => {
      try {
        // Parallel requests: HEAD for headers, Image load for dimensions (if image)
        const headPromise = fetch(fileUrl, { method: 'HEAD' });

        let dimensionsPromise: Promise<string | null> = Promise.resolve(null);
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
          fileExt.toLowerCase(),
        );

        if (isImage) {
          dimensionsPromise = new Promise((resolve) => {
            const img = new Image();
            img.src = fileUrl;
            img.onload = () => resolve(`${img.naturalWidth}x${img.naturalHeight}px`);
            img.onerror = () => resolve(null);
          });
        }

        const [response, dimensions] = await Promise.all([headPromise, dimensionsPromise]);

        if (!mounted) return;

        if (response.ok) {
          const size = parseInt(response.headers.get('content-length') || '0', 10);
          const type = response.headers.get('content-type');
          const lastModified = response.headers.get('last-modified');

          setMetadata({
            size: size > 0 ? size : undefined,
            type: type || undefined,
            lastModified: lastModified ? new Date(lastModified).toLocaleDateString() : undefined,
            dimensions: dimensions || undefined,
          });
        } else {
          setError(true);
        }
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMetadata();

    return () => {
      mounted = false;
    };
  }, [fileUrl, fileExt]);

  const getFileIcon = (ext: string) => {
    const e = ext.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(e))
      return <ImageIcon size={20} className="text-offense" />;
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(e))
      return <Archive size={20} className="text-defense" />;
    if (['js', 'ts', 'py', 'cpp', 'c', 'html', 'css', 'json'].includes(e))
      return <FileCode size={20} className="text-blue-400" />;
    return <FileText size={20} className="text-gray-400" />;
  };

  return (
    <div className="relative group my-8 w-full print:hidden">
      <div className="bg-[#0a0f14] border border-gray-800 transition-colors p-0 overflow-hidden flex flex-col md:flex-row">
        {/* Left Panel: Icon & Basic Info */}
        <div className="bg-gray-900/50 p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-800 min-w-[80px] gap-2">
          <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700 transition-colors">
            {getFileIcon(fileExt)}
          </div>
        </div>

        {/* Middle Panel: Metadata */}
        <div className="flex-1 p-4 flex flex-col justify-center">
          {/* Decode filename for display, but keep original for download */}
          <div className="text-sm font-bold text-white font-mono break-all">
            {decodeURIComponent(fileName).replace(/^([0-9]+[-_\s]+)+/, '')}
          </div>
          {metadata && (
            <div className="text-xs text-gray-500 mt-1 font-mono flex gap-3">
              {metadata.size && <span>{formatBytes(metadata.size)}</span>}
              {metadata.type && <span>{metadata.type}</span>}
            </div>
          )}
        </div>

        {/* Right Panel: Actions */}
        <div className="bg-gray-900/50 p-4 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-gray-800 min-w-[80px]">
          <a
            href={fileUrl}
            download={decodeURIComponent(fileName)}
            className="text-gray-400 hover:text-offense transition-colors"
            title="Download"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download size={20} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default FileAttachment;
