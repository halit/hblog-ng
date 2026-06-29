import React from 'react';
import { Wifi, ArrowRight } from 'lucide-react';
import HexBackground from '@/components/layout/HexBackground';
import GlitchText from '@/components/ui/GlitchText';
import SpectrumMeter from '@/components/ui/SpectrumMeter';
import { calculateSpectrum } from '@/utils';
import { VaultNode } from '@/types/vault';
import { NavLink } from '@/components/ui/NavLink';

interface HomeProps {
  latestPost: VaultNode;
}

const Home: React.FC<HomeProps> = ({ latestPost }) => {
  if (!latestPost || !latestPost.id) {
    return (
      <div className="flex-1 flex flex-col justify-center relative overflow-hidden min-h-[calc(100vh-64px)] w-full">
        <HexBackground />
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center relative overflow-hidden min-h-[calc(100vh-64px)] w-full">
      <HexBackground />
      <div className="container mx-auto px-6 max-w-6xl grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-6 text-left">
          <h1 className="text-3xl md:text-5xl font-display text-white leading-tight tracking-tighter mix-blend-difference drop-shadow-2xl">
            I'm researching on <GlitchText /> <br />
            to protect critical infrastructures.
          </h1>
        </div>

        <div className="hidden md:flex justify-end">
          <NavLink
            id={latestPost.id}
            node={latestPost}
            className="w-full max-w-sm relative group cursor-pointer"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-offense to-defense opacity-50 blur-[2px] group-hover:blur-[4px] transition-all"></div>
            <div className="relative bg-[#0a0f14] p-6 border border-gray-800 transition-all duration-300 group-hover:border-offense/50 group-hover:shadow-[0_0_20px_-5px_rgba(255,0,85,0.15)]">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-offense text-[10px] font-bold uppercase tracking-widest animate-pulse">
                  <Wifi size={12} /> Incoming_Signal
                </div>
                <span className="font-mono text-[10px] text-gray-500">
                  {latestPost.type === 'research'
                    ? latestPost.year || new Date(latestPost.updated).getFullYear()
                    : latestPost.type === 'project'
                      ? new Date(latestPost.updated).getFullYear()
                      : new Date(latestPost.updated).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white font-display mb-2 transition-colors">
                {latestPost.title}
              </h3>
              <p className="text-xs text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                {latestPost.description}
              </p>
              <div className="flex justify-between items-center text-xs font-mono text-gray-500 pt-2 border-t border-gray-800">
                <ArrowRight
                  size={16}
                  className="text-white group-hover:translate-x-1 transition-transform group-hover:text-offense"
                />
                <SpectrumMeter
                  distribution={calculateSpectrum(latestPost.content, latestPost)}
                  align="right"
                  className="w-[80px]"
                />
              </div>
            </div>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Home;
