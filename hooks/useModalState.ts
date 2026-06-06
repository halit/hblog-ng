'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ModalState {
  contactOpen: boolean;
  searchOpen: boolean;
  neuralLinkOpen: boolean;
  commandPaletteOpen: boolean;
  neuralGraphSearchTerm: string;
  setContactOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setNeuralLinkOpen: (v: boolean) => void;
  closeNeuralLink: () => void;
  setCommandPaletteOpen: (v: boolean) => void;
}

/**
 * Manages all global modal states for AppLayout.
 * Handles:
 *   - Escape key closes the topmost open modal
 *   - `openNeuralGraph` custom event opens the graph with an optional search term
 *   - Clears the neural graph search term when the modal closes
 */
export function useModalState(): ModalState {
  const [contactOpen, setContactOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [neuralLinkOpen, setNeuralLinkOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [neuralGraphSearchTerm, setNeuralGraphSearchTerm] = useState('');

  // Escape closes the topmost open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (commandPaletteOpen) {
        setCommandPaletteOpen(false);
        return;
      }
      if (searchOpen) {
        setSearchOpen(false);
        return;
      }
      if (contactOpen) {
        setContactOpen(false);
        return;
      }
      if (neuralLinkOpen) {
        setNeuralLinkOpen(false);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, searchOpen, contactOpen, neuralLinkOpen]);

  // `openNeuralGraph` custom event (dispatched by other components)
  useEffect(() => {
    const handleOpenGraph = (e: Event) => {
      const detail = (e as CustomEvent<{ searchTerm?: string }>).detail;
      setNeuralGraphSearchTerm(detail?.searchTerm ?? '');
      setNeuralLinkOpen(true);
    };
    window.addEventListener('openNeuralGraph', handleOpenGraph);
    return () => window.removeEventListener('openNeuralGraph', handleOpenGraph);
  }, []);

  // Atomically close the neural link modal and clear its search term
  const closeNeuralLink = useCallback(() => {
    setNeuralLinkOpen(false);
    setNeuralGraphSearchTerm('');
  }, []);

  return {
    contactOpen,
    setContactOpen,
    searchOpen,
    setSearchOpen,
    neuralLinkOpen,
    setNeuralLinkOpen,
    closeNeuralLink,
    commandPaletteOpen,
    setCommandPaletteOpen,
    neuralGraphSearchTerm,
  };
}
