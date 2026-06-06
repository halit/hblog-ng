'use client';

import React from 'react';
import { getIconComponent } from '@/utils/icons';

interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
  icon?: string;
}

interface PostTimelineProps {
  events?: TimelineEvent[];
}

const PostTimeline: React.FC<PostTimelineProps> = ({ events = [] }) => {
  if (!events || events.length === 0) return null;

  // Sort events by date (newest first)
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const getEventIcon = (icon?: string) => {
    const Icon = getIconComponent(icon || 'clock', 'Clock');
    return <Icon size={16} className="text-white" />;
  };

  return (
    <div className="my-8">
      <div className="relative">
        <div className="space-y-8">
          {sortedEvents.map((event, idx) => {
            const eventDate = new Date(event.date);
            const isRecent = Date.now() - eventDate.getTime() < 90 * 24 * 60 * 60 * 1000; // Within 90 days
            const isLast = idx === sortedEvents.length - 1;

            return (
              <div key={idx} className="relative flex items-start gap-4 group">
                {/* Timeline line between items - only show if not last item */}
                {!isLast && (
                  <div
                    className="absolute left-6 w-[2px] bg-gray-800 z-0"
                    style={{
                      // Circle is w-12 h-12 = 3rem (48px), center at 1.5rem from top
                      // space-y-8 creates 2rem (32px) gap between items
                      // Line should connect from center of current circle to center of next circle
                      // Extend slightly more to ensure it touches the next circle
                      // Calculation:
                      // - Start at center of current circle: 1.5rem from top of current item
                      // - Distance to next center: 1.5rem (to bottom of current) + 2rem (gap) + 1.5rem (to center of next) = 5rem
                      // - Add 0.25rem extra to ensure it touches
                      top: '1.5rem', // Start at center of current circle
                      height: '5.25rem', // 5rem + 0.25rem extra to ensure it touches the next circle
                    }}
                  ></div>
                )}

                {/* Timeline dot - solid background */}
                <div
                  className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border border-gray-800 bg-[#0a0f14] shadow-lg group-hover:border-gray-700 transition-colors`}
                >
                  {getEventIcon(event.icon)}
                </div>

                {/* Event content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-gray-500">
                      {eventDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {isRecent && (
                      <span className="text-[10px] bg-offense/20 text-offense px-1.5 py-0.5 rounded font-mono">
                        RECENT
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white font-mono mb-2 uppercase tracking-tight">
                    {event.title}
                  </h4>
                  {event.description && (
                    <p className="text-sm text-gray-400 leading-relaxed">{event.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PostTimeline;
