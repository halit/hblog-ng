'use client';

import React from 'react';
import { useLazyVaultData } from '@/hooks/useLazyVaultData';
import NeuralGraph from '@/components/graph/NeuralGraph';

interface NeuralLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearchTerm?: string;
}

const NeuralLinkModal: React.FC<NeuralLinkModalProps> = ({
  isOpen,
  onClose,
  initialSearchTerm,
}) => {
  const [vaultData, isLoading, loadVaultData] = useLazyVaultData();

  React.useEffect(() => {
    if (isOpen) {
      loadVaultData();
    }
  }, [isOpen, loadVaultData]);

  if (!isOpen) return null;

  // Use fixed positioning and z-index to ensure modal behavior
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center overflow-hidden"
      onClick={onClose}
    >
      {/* Inner container with specific dimensions to be a "modal" not full page */}
      <div
        className="relative w-[90vw] h-[85vh] max-w-[1400px] bg-[#0a0f14] border border-gray-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {!isLoading && vaultData.length > 0 ? (
          <NeuralGraph data={vaultData} onClose={onClose} initialSearchTerm={initialSearchTerm} />
        ) : (
          <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-gray-500 font-mono text-sm">
            <div className="w-8 h-8 border-2 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
            <span>INITIALIZING NEURAL INTERFACE...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeuralLinkModal;
