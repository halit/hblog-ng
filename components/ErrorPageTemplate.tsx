'use client';

import React from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import GlitchText from './GlitchText';
import HexBackground from './HexBackground';
import { useRouter } from 'next/navigation';

interface ErrorPageTemplateProps {
  code: string;
  title: string;
  message: string;
  children?: React.ReactNode;
  onRetry?: () => void;
  isDefense?: boolean;
}

const ErrorPageTemplate: React.FC<ErrorPageTemplateProps> = ({
  code,
  title,
  message,
  children,
  onRetry,
  isDefense = false,
}) => {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 w-full min-h-[calc(100vh-200px)] relative">
      <HexBackground />

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)]" />

      <div className="z-10 max-w-5xl w-full text-center">
        <div className="mb-8 relative inline-block select-none">
          <h1
            className={`text-9xl font-black font-mono tracking-tighter opacity-80 ${isDefense ? 'text-defense' : 'text-offense'}`}
          >
            {code}
          </h1>
          <div
            className={`absolute top-0 left-0 w-full h-full ${isDefense ? 'text-defense' : 'text-offense'} opacity-30 blur-md animate-pulse`}
          >
            {code}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-mono uppercase mb-6 tracking-widest">
            <GlitchText text={title.toUpperCase()} mode={isDefense ? 'defense' : 'offense'} />
          </h2>
          <p className="text-gray-400 font-mono max-w-lg mx-auto text-lg leading-relaxed py-2 px-4">
            {message}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-24">
          <button
            onClick={() => router.back()}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded text-sm font-mono border border-gray-700 flex items-center gap-2 transition-all hover:border-gray-500"
          >
            <ArrowLeft size={14} />
            <span>RETURN</span>
          </button>

          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-red-900/20 hover:bg-red-900/40 text-red-400 px-4 py-2 rounded text-sm font-mono border border-red-900/50 flex items-center gap-2 transition-all hover:border-red-500"
            >
              <AlertTriangle size={14} />
              <span>RETRY</span>
            </button>
          )}
        </div>

        {children}
      </div>
    </div>
  );
};

export default ErrorPageTemplate;
