'use client';

import { useState, useEffect, Suspense } from 'react';
import React from 'react';
import { ProgressBar } from '@/components/ProgressBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ContactModal, NeuralLinkModal } from '@/components/Modals';
import SearchModal from '@/components/SearchModal';
import CommandPalette from '@/components/CommandPalette';
import { useCommandHandler } from '@/hooks/useCommandHandler';
import { useModalState } from '@/hooks/useModalState';
import { buildCommands } from '@/config/commands';
import { useNetworkStats } from '@/hooks/useNetworkStats';
import { usePathname, useSearchParams } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
}

function NavigationEvents({ setIsPageLoading }: { setIsPageLoading: (v: boolean) => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    setIsPageLoading(false);
  }, [pathname, searchParams, setIsPageLoading]);
  return null;
}

export default function AppLayout({ children }: LayoutProps) {
  const { rx, tx } = useNetworkStats();
  const [isPageLoading, setIsPageLoading] = useState(false);

  const {
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
  } = useModalState();

  const commands = buildCommands({
    openSearch: () => setSearchOpen(true),
    openNeuralLink: () => setNeuralLinkOpen(true),
    openContact: () => setContactOpen(true),
    openCommandPalette: () => setCommandPaletteOpen(true),
    goBack: () => window.history.back(),
    goForward: () => window.history.forward(),
  });

  useCommandHandler({ commands, enabled: !commandPaletteOpen });

  // Show page-loading bar on internal link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor?.href) return;

      const isExternal = !anchor.href.startsWith(window.location.origin);
      const isNewTab = anchor.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey;
      const isHashLink = anchor.href.includes('#') && anchor.pathname === window.location.pathname;
      if (isExternal || isNewTab || isHashLink) return;

      const current = new URL(window.location.href);
      const target = new URL(anchor.href);
      if (target.pathname !== current.pathname || target.search !== current.search) {
        setIsPageLoading(true);
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={null}>
        <NavigationEvents setIsPageLoading={setIsPageLoading} />
      </Suspense>
      <div className="print:hidden">
        <Navbar
          setContactOpen={setContactOpen}
          setSearchOpen={setSearchOpen}
          setNeuralLinkOpen={setNeuralLinkOpen}
          setCommandPaletteOpen={setCommandPaletteOpen}
        />
      </div>
      <div className="print:hidden">
        <ProgressBar isLoading={isPageLoading} />
      </div>
      <main className="flex-1 pt-16 flex flex-col relative w-full overflow-hidden print:pt-0 print:overflow-visible">
        {children}
      </main>
      <div className="print:hidden">
        <Footer rx={rx} tx={tx} />
      </div>
      <div className="print:hidden">
        <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
        <NeuralLinkModal
          isOpen={neuralLinkOpen}
          onClose={closeNeuralLink}
          initialSearchTerm={neuralGraphSearchTerm}
        />
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          commands={commands}
        />
      </div>
    </div>
  );
}
