import React from 'react';
import { SpectrumDistribution } from '../utils';

interface SpectrumMeterProps {
  distribution: SpectrumDistribution;
  align?: 'left' | 'right';
  className?: string;
}

const SpectrumMeter: React.FC<SpectrumMeterProps> = ({
  distribution,
  align = 'right',
  className = '',
}) => {
  // "Cyber Block" Design
  // Bold, visible, high-contrast blocks.
  // 10 blocks total for a solid look (matching the 0-10 scale).

  const totalBlocks = 10;
  const miscVal = distribution.misc || 0;
  const total = distribution.offensive + distribution.defensive + miscVal;
  const safeTotal = total === 0 ? 1 : total;

  const offCount = Math.round((distribution.offensive / safeTotal) * totalBlocks);
  let defCount = Math.round((distribution.defensive / safeTotal) * totalBlocks);

  // Clamp to ensure we don't exceed totalBlocks
  if (offCount + defCount > totalBlocks) {
    defCount = totalBlocks - offCount;
  }

  return (
    <div
      className={`inline-flex flex-col gap-1 ${align === 'right' ? 'ml-auto' : ''} ${className}`}
    >
      {/* The Meter Track */}
      <div className="flex gap-[2px] h-3 w-full items-end">
        {Array.from({ length: totalBlocks }).map((_, i) => {
          let type: 'offense' | 'defense' | 'misc' = 'misc';

          if (i < offCount) type = 'offense';
          else if (i < offCount + defCount) type = 'defense';

          let colorClass = 'bg-gray-500';
          let shadowClass = 'shadow-[0_0_8px_rgba(107,114,128,0.6)]';

          if (type === 'offense') {
            colorClass = 'bg-offense';
            shadowClass = 'shadow-[0_0_8px_rgba(255,0,85,0.6)]';
          } else if (type === 'defense') {
            colorClass = 'bg-defense';
            shadowClass = 'shadow-[0_0_8px_rgba(0,229,255,0.6)]';
          }

          return (
            <div
              key={i}
              className={`
                flex-1 rounded-[1px] h-full
                ${colorClass}
                ${shadowClass}
                print:shadow-none
                relative overflow-hidden
                transition-all duration-300 hover:scale-y-110
              `}
            >
              {/* Scanline overlay */}
              <div
                className="absolute inset-0 bg-white/20 animate-[pulse_1.5s_ease-in-out_infinite] print:hidden"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpectrumMeter;
