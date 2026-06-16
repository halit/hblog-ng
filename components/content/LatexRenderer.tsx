'use client';

import React, { useState, useRef } from 'react';
import { BlockMath } from 'react-katex';
import { Copy, CheckCircle, Sigma } from 'lucide-react';
import html2canvas from 'html2canvas';
import 'katex/dist/katex.min.css';
import BlockHeader from '@/components/ui/BlockHeader';

interface LatexRendererProps {
  math: string;
}

const LatexRenderer: React.FC<LatexRendererProps> = ({ math }) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const copyAsImage = async () => {
    if (!containerRef.current || isGenerating) return;

    try {
      setIsGenerating(true);

      // Create canvas from the element
      const sourceCanvas = await html2canvas(containerRef.current, {
        backgroundColor: '#0a0f14', // Match theme background
        scale: 3, // High resolution for better quality
        logging: false,
        useCORS: true, // Handle potential font loading issues
      });

      // Create final canvas with watermark header
      const finalCanvas = document.createElement('canvas');
      const renderScale = 3; // Matches html2canvas scale
      const headerHeight = 32 * renderScale;
      const padding = 16 * renderScale;
      const contentPadding = 32 * renderScale;

      // Get URL
      const sourceUrl = `Source: ${window.location.href}`;

      // Calculate width needed for text
      const tempCtx = document.createElement('canvas').getContext('2d');
      let textWidth = 0;
      if (tempCtx) {
        tempCtx.font = `${12 * renderScale}px "JetBrains Mono", monospace`;
        textWidth = tempCtx.measureText(sourceUrl).width;
      }

      const minWidth = textWidth + padding * 2;
      finalCanvas.width = Math.max(sourceCanvas.width + contentPadding * 2, minWidth);
      finalCanvas.height = sourceCanvas.height + headerHeight + contentPadding * 2;

      const ctx = finalCanvas.getContext('2d');
      if (!ctx) {
        setIsGenerating(false);
        return;
      }

      // Fill background
      ctx.fillStyle = '#0a0f14';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Draw Header Background
      ctx.fillStyle = '#101725';
      ctx.fillRect(0, 0, finalCanvas.width, headerHeight);

      // Draw Header Border
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1 * renderScale;
      ctx.beginPath();
      ctx.moveTo(0, headerHeight);
      ctx.lineTo(finalCanvas.width, headerHeight);
      ctx.stroke();

      // Draw Source URL
      ctx.font = `${12 * renderScale}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#9ca3af'; // text-gray-400
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(sourceUrl, padding, headerHeight / 2);

      // Draw source canvas centered
      const imgX = (finalCanvas.width - sourceCanvas.width) / 2;
      const imgY = headerHeight + contentPadding;
      ctx.drawImage(sourceCanvas, imgX, imgY);

      // Convert to blob
      finalCanvas.toBlob(async (blob) => {
        if (!blob) {
          setIsGenerating(false);
          return;
        }

        try {
          // Copy to clipboard
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy to clipboard:', err);
          // Fallback to copying LaTeX code if image copy fails?
          // navigator.clipboard.writeText(math);
        } finally {
          setIsGenerating(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Failed to generate image:', err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative group my-8">
      <div className="bg-[#0a0f14] border border-gray-800 rounded-lg overflow-hidden shadow-xl">
        <BlockHeader
          title="LaTeX Equation"
          icon={Sigma}
          rightElement={
            <button
              onClick={copyAsImage}
              disabled={isGenerating}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700 flex items-center gap-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copied ? <CheckCircle size={12} className="text-defense" /> : <Copy size={12} />}
              {copied ? 'Copied' : isGenerating ? '...' : 'Copy'}
            </button>
          }
        />
        <div
          ref={containerRef}
          className="p-6 overflow-x-auto bg-[#0a0f14] flex justify-center items-center min-h-[80px]"
        >
          <BlockMath math={math} />
        </div>
      </div>
    </div>
  );
};

export default LatexRenderer;
