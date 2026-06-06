'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Menu, X, Search, HelpCircle, Network } from 'lucide-react';
import { config } from '../config/env';

interface NavbarProps {
  setContactOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setNeuralLinkOpen: (v: boolean) => void;
  setCommandPaletteOpen?: (v: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  setContactOpen,
  setSearchOpen,
  setNeuralLinkOpen,
  setCommandPaletteOpen,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { id: 'home', label: 'HOME', path: '/' },
    { id: 'about', label: 'WHOAMI', path: '/about' },
    { id: 'research_index', label: 'RESEARCH', path: '/research' },
    { id: 'projects_index', label: 'PROJECTS', path: '/projects' },
    { id: 'posts_index', label: 'POSTS', path: '/posts' },
  ];

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const titleParts = config.siteTitle.toUpperCase().split(/\s+/).filter(Boolean);

  return (
    <>
      <header className="fixed top-0 w-full z-50 h-16 bg-[#050505]/95 backdrop-blur border-b border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            prefetch={false}
            className="flex items-center gap-1.5 cursor-pointer group select-none font-display text-xl tracking-tight"
          >
            {titleParts.map((part, idx) => (
              <React.Fragment key={idx}>
                <span className="text-white font-bold">{part}</span>
                {idx < titleParts.length - 1 && (
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse-slow bg-offense"></div>
                )}
              </React.Fragment>
            ))}
          </Link>
        </div>

        <nav className="hidden md:flex gap-8 text-[10px] font-mono font-bold tracking-widest text-gray-500">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.path}
              prefetch={false}
              className={`hover:text-white transition-colors py-1 relative ${isActive(item.path) ? 'text-white' : ''}`}
            >
              {item.label}
              {isActive(item.path) && (
                <div className="absolute -bottom-[21px] left-0 w-full h-[2px] bg-offense"></div>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 hover:bg-white/5 rounded text-gray-400 hover:text-defense transition-colors hidden md:block"
            title="Search (Ctrl+F)"
            aria-label="Search"
          >
            <Search size={16} />
          </button>
          {setCommandPaletteOpen && (
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="p-2 hover:bg-white/5 rounded text-gray-400 hover:text-defense transition-colors hidden md:block"
              title="Commands (Ctrl+K)"
            >
              <HelpCircle size={16} />
            </button>
          )}
          <button
            onClick={() => setNeuralLinkOpen(true)}
            className="p-2 hover:bg-white/5 rounded text-gray-400 hover:text-defense transition-colors hidden md:block"
            title="Knowledge Graph (Ctrl+G)"
            aria-label="Knowledge Graph"
          >
            <Network size={16} />
          </button>
          <button
            onClick={() => setContactOpen(true)}
            className="p-2 hover:bg-white/5 rounded text-gray-400 hover:text-defense transition-colors hidden md:block"
            title="Contact (Ctrl+M)"
            aria-label="Contact"
          >
            <Mail size={16} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-300 md:hidden"
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#050505] pt-20 px-6 animate-in slide-in-from-right duration-200">
          <div className="flex flex-col gap-6 font-display">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.path}
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className="text-3xl font-bold text-white text-left border-b border-gray-800 pb-4"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
