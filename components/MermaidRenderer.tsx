'use client';

import React, { useEffect, useState } from 'react';
import { Share2, Copy, CheckCircle } from 'lucide-react';
import BlockHeader from './BlockHeader';

interface Mermaid {
  initialize: (config: unknown) => void;
  render: (id: string, text: string) => Promise<{ svg: string }>;
}

const MermaidRenderer = ({ code, title }: { code: string; title?: string }) => {
  const [error, setError] = useState<string | null>(null);
  const [inlineSvg, setInlineSvg] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (!code) return;

    const config = {
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#111827',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#ff0055',
        lineColor: '#ffffff',
        secondaryColor: '#111827',
        tertiaryColor: '#050505',
        mainBkg: '#0a0f14',
        nodeBkg: '#111827',
        nodeBorder: '#ff0055',
        clusterBkg: '#0a0f14',
        clusterBorder: '#00e5ff',
        edgeLabelBackground: '#0a0f14',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '14px',
      },
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 150,
        width: 300,
        height: 65,
        boxMargin: 20,
        boxTextMargin: 5,
        noteMargin: 20,
        messageMargin: 60,
        mirrorActors: false,
        bottomMarginAdj: 1,
        useMaxWidth: true,
        rightAngles: false,
        showSequenceNumbers: false,
        wrap: true,
      },
      gantt: {
        titleTopMargin: 25,
        barHeight: 20,
        barGap: 4,
        topPadding: 50,
        leftPadding: 75,
        gridLineStartPadding: 35,
        fontSize: 11,
        fontFamily: '"JetBrains Mono", monospace',
        numberSectionStyles: 4,
        axisFormat: '%Y-%m-%d',
      },
    };

    const loadMermaid = (): Promise<Mermaid> => {
      return new Promise((resolve, reject) => {
        // Check if Mermaid is already loaded
        const win = window as unknown as { mermaid: Mermaid };
        if (win.mermaid) {
          resolve(win.mermaid);
          return;
        }

        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="mermaid"]');
        if (existingScript) {
          // Wait for it to load
          const checkInterval = setInterval(() => {
            if (win.mermaid) {
              clearInterval(checkInterval);
              resolve(win.mermaid);
            }
          }, 100);

          setTimeout(() => {
            clearInterval(checkInterval);
            if (!win.mermaid) {
              reject(new Error('Mermaid script loaded but library not available'));
            }
          }, 10000);
          return;
        }

        // Load Mermaid script
        const script = document.createElement('script');
        // Use local version instead of CDN
        script.src = '/mermaid/mermaid.min.js';
        script.async = true;
        script.onload = () => {
          const mermaid = win.mermaid;
          if (mermaid) {
            resolve(mermaid);
          } else {
            reject(new Error('Mermaid library not available after script load'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load Mermaid script'));
        document.head.appendChild(script);
      });
    };

    const initMermaid = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setInlineSvg(null);
        setImageData(null);

        // Load Mermaid library
        const mermaid = await loadMermaid();

        if (!mermaid) {
          throw new Error('Mermaid library not available');
        }

        // Create a unique ID for this mermaid diagram
        const mermaidId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Initialize Mermaid (check if already initialized)
        try {
          // Try to initialize - it's safe to call multiple times
          mermaid.initialize(config);
        } catch {
          // If already initialized, that's fine
        }

        // Wait a bit to ensure initialization
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Wait for web fonts to finish loading before rendering. Mermaid sizes every
        // box to the text width it measures at render time; if the font is still
        // swapping it measures the narrower fallback metrics and the final glyphs
        // overflow the box by a few pixels.
        try {
          await document.fonts?.ready;
        } catch {
          // document.fonts may be unavailable; rendering still works, just less exact
        }

        // Render the diagram using render method (returns SVG string, no DOM manipulation)
        let svgContent: string | null = null;
        try {
          // Use render method which returns SVG string directly (no DOM manipulation)
          if (typeof mermaid.render === 'function') {
            const renderResult = await mermaid.render(mermaidId, code.trim());
            if (renderResult && renderResult.svg) {
              // Parse SVG to fix dimensions for export
              const parser = new DOMParser();
              const doc = parser.parseFromString(renderResult.svg, 'image/svg+xml');
              const svgElement = doc.documentElement;

              // Force all background colors to match theme
              // This handles potential hardcoded styles in mermaid output
              const styles = svgElement.getElementsByTagName('style');
              for (let i = 0; i < styles.length; i++) {
                const textContent = styles[i].textContent || '';
                if (textContent) {
                  let newTextContent = textContent.replace(/fill:\s*#ECECFF/gi, 'fill: #111827');
                  newTextContent = newTextContent.replace(/fill:\s*#f9f9f9/gi, 'fill: #111827');
                  // Replace default black/white fills if any
                  newTextContent = newTextContent.replace(/fill:\s*white/gi, 'fill: #111827');
                  styles[i].textContent = newTextContent;
                }
              }

              // Also iterate over elements with fill attributes
              const elements = svgElement.querySelectorAll('[fill]');
              elements.forEach((el) => {
                const fill = el.getAttribute('fill');
                if (
                  fill === '#ECECFF' ||
                  fill === '#f9f9f9' ||
                  fill === 'white' ||
                  fill === '#FFFFFF'
                ) {
                  el.setAttribute('fill', '#111827');
                }
              });

              // Resize the label boxes Mermaid draws (notes get class "note", sequence
              // participants get class "actor") to fit their text with a consistent
              // margin. Mermaid sizes these from its own text measurement, which can run
              // short (text spills out) or leave uneven gaps. We re-measure each label
              // with a canvas using the same font, then set the box width to the text
              // plus a fixed margin on each side and re-center it (the text is centered,
              // so it stays put). Fonts are already awaited above, so canvas metrics
              // match what the SVG renders. Baked into the string before serialization,
              // which is the path that actually sticks.
              const MARGIN = 26;
              const measureCtx = document.createElement('canvas').getContext('2d');
              if (measureCtx) {
                const fontFamily = '"JetBrains Mono", monospace';
                const readPx = (el: Element) => {
                  const attr = el.getAttribute('font-size');
                  if (attr) return parseFloat(attr) || 14;
                  const m = (el.getAttribute('style') || '').match(/font-size:\s*([\d.]+)px/);
                  return m ? parseFloat(m[1]) : 14;
                };

                let boxes = Array.from(svgElement.querySelectorAll('rect.note, rect.actor'));
                if (boxes.length === 0) {
                  // Fall back to any rect that backs a text label, in case the class
                  // names differ for some diagram type.
                  boxes = Array.from(svgElement.querySelectorAll('rect')).filter((rect) =>
                    rect.parentElement?.querySelector(':scope > text'),
                  );
                }

                boxes.forEach((rect) => {
                  const texts = rect.parentElement?.querySelectorAll(':scope > text');
                  if (!texts || texts.length === 0) return;
                  const x = parseFloat(rect.getAttribute('x') || '0');
                  const width = parseFloat(rect.getAttribute('width') || '0');
                  if (!width) return;

                  // A wrapped note renders each line as its own <text> (and a line may
                  // also be split into <tspan>s). Measure every line and keep the widest.
                  let textWidth = 0;
                  texts.forEach((textEl) => {
                    const spans = textEl.querySelectorAll('tspan');
                    const lines = spans.length ? Array.from(spans) : [textEl];
                    lines.forEach((line) => {
                      const content = line.textContent || '';
                      if (!content) return;
                      measureCtx.font = `${readPx(line)}px ${fontFamily}`;
                      textWidth = Math.max(textWidth, measureCtx.measureText(content).width);
                    });
                  });
                  if (!textWidth) return;

                  const desired = Math.ceil(textWidth + 2 * MARGIN);
                  // Leave notes that intentionally span multiple participants (much
                  // wider than their text) alone; otherwise normalize to a uniform margin.
                  const newWidth = width > desired + 40 ? width : desired;

                  const center = x + width / 2;
                  rect.setAttribute('x', String(center - newWidth / 2));
                  rect.setAttribute('width', String(newWidth));
                });
              }

              // Parse the viewBox for the diagram's natural dimensions.
              const viewBox = svgElement.getAttribute('viewBox');
              let naturalW = 0;
              let naturalH = 0;
              if (viewBox) {
                const [, , w, h] = viewBox.split(/\s+|,\s*/).map(Number);
                if (!isNaN(w) && !isNaN(h)) {
                  naturalW = w;
                  naturalH = h;
                }
              }

              // Inline (display) version: rendered directly in the page so its text is
              // measured against the same fonts/CSS Mermaid used when sizing the boxes.
              // Embedding the SVG in an <img> instead would isolate it from the page
              // fonts, so labels would render in a wider fallback font and overflow
              // their rectangles. Render it at its natural size and only cap it with
              // max-width so it shrinks on narrow viewports without ever upscaling.
              if (naturalW && naturalH) {
                svgElement.setAttribute('width', naturalW.toString());
                svgElement.setAttribute('height', naturalH.toString());
              }
              svgElement.style.maxWidth = '100%';
              svgElement.style.height = 'auto';
              setInlineSvg(new XMLSerializer().serializeToString(doc));
              setIsLoading(false);

              // Export version: same fixed pixel dimensions, but unconstrained, so the
              // "Copy as image" PNG has a real intrinsic size in an Image()/canvas.
              svgElement.style.maxWidth = 'none';
              svgElement.style.removeProperty('height');

              svgContent = new XMLSerializer().serializeToString(doc);
            }
          }
        } catch (renderError) {
          console.error('Mermaid render method failed:', renderError);
          throw new Error(
            `Mermaid render failed: ${renderError instanceof Error ? renderError.message : 'Unknown error'}`,
          );
        }

        // If render() didn't produce SVG, throw error
        if (!svgContent) {
          throw new Error('Mermaid render() did not return SVG content');
        }

        // Convert SVG string directly to base64 (no DOM manipulation needed)
        // This avoids all React DOM conflicts
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setImageData(base64);
          setIsLoading(false);
        };
        reader.onerror = () => {
          throw new Error('Failed to convert SVG to base64');
        };
        reader.readAsDataURL(svgBlob);
      } catch (e) {
        console.error('Mermaid render error', e);
        setError(e instanceof Error ? e.message : 'Failed to render diagram');
        setIsLoading(false);
      }
    };

    // Start initialization with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      initMermaid();
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      // No DOM manipulation needed - React handles cleanup
    };
  }, [code]);

  const copyImageAsImage = async () => {
    if (!imageData || isCopying) return;

    try {
      setIsCopying(true);

      // Create an image to render the SVG
      const img = new Image();
      img.src = imageData;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Create canvas
      const canvas = document.createElement('canvas');
      // Scale up for better quality
      const scale = 2;
      const headerHeight = 32 * scale;
      const padding = 16 * scale;
      const contentPadding = 32 * scale;

      // Get URL
      const sourceUrl = `Source: ${window.location.href}`;

      // Calculate width needed for text
      const tempCtx = document.createElement('canvas').getContext('2d');
      let textWidth = 0;
      if (tempCtx) {
        tempCtx.font = `${12 * scale}px "JetBrains Mono", monospace`;
        textWidth = tempCtx.measureText(sourceUrl).width;
      }

      // Use natural dimensions from the SVG or calculate from getBoundingClientRect if loaded in DOM
      // When loading from base64 string, naturalWidth/Height should be correct if SVG has width/height attributes
      // which we ensure in the render logic
      // Ensure canvas is wide enough for the watermark text plus padding
      const minWidth = textWidth + padding * 2;
      canvas.width = Math.max(img.naturalWidth * scale + contentPadding * 2, minWidth);
      canvas.height = img.naturalHeight * scale + headerHeight + contentPadding * 2;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Fill background (dark mode)
      ctx.fillStyle = '#0a0f14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Header Background
      ctx.fillStyle = '#101725';
      ctx.fillRect(0, 0, canvas.width, headerHeight);

      // Draw Header Border
      ctx.strokeStyle = '#1f2937'; // gray-800
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(0, headerHeight);
      ctx.lineTo(canvas.width, headerHeight);
      ctx.stroke();

      // Draw Source URL
      ctx.font = `${12 * scale}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#9ca3af'; // text-gray-400
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(sourceUrl, padding, headerHeight / 2);

      // Draw image centered horizontally
      const imgX = (canvas.width - img.naturalWidth * scale) / 2;
      const imgY = headerHeight + contentPadding;
      ctx.drawImage(img, imgX, imgY, img.naturalWidth * scale, img.naturalHeight * scale);

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

      if (!blob) throw new Error('Failed to create PNG blob');

      // Copy image to clipboard
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy image:', error);
      // Don't fallback to text, just show error state implicitly (button stays uncopied)
      // Or could show a temporary error icon
    } finally {
      setIsCopying(false);
    }
  };

  if (error) {
    return (
      <div className="my-8 bg-[#0a0f14] border border-red-500/50 p-6 rounded">
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 mb-4">
          <span className="text-[10px] font-mono text-red-500 uppercase">
            Mermaid Error: {error}
          </span>
        </div>
        <pre className="text-gray-500 text-xs font-mono whitespace-pre-wrap bg-gray-900 p-4 rounded">
          {code}
        </pre>
      </div>
    );
  }

  return (
    <div className="relative group my-8">
      <div className="bg-[#0a0f14] print:bg-transparent border border-gray-800 print:border-none rounded-lg overflow-hidden shadow-xl print:shadow-none">
        <BlockHeader
          title={title || 'Mermaid Diagram'}
          icon={Share2}
          rightElement={
            imageData && (
              <button
                onClick={copyImageAsImage}
                disabled={isCopying}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700 flex items-center gap-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copied ? <CheckCircle size={12} className="text-defense" /> : <Copy size={12} />}
                {copied ? 'Copied' : isCopying ? '...' : 'Copy'}
              </button>
            )
          }
        />
        <div className="p-6 overflow-x-auto bg-[#0a0f14] print:bg-transparent text-center">
          {inlineSvg ? (
            <div
              className="inline-block max-w-full [&>svg]:inline-block print:invert print:hue-rotate-180"
              dangerouslySetInnerHTML={{ __html: inlineSvg }}
            />
          ) : (
            <div className="text-gray-500 text-xs font-mono">
              {isLoading ? 'Rendering diagram...' : 'Preparing diagram...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MermaidRenderer;
