import React from 'react';
import { Terminal, Shield, Gift, Mail } from 'lucide-react';
import { config } from '@/config/env';

const BugBounty = () => {
  return (
    <div className="container mx-auto px-6 pt-24 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div className="relative bg-[#0a0f14] border border-gray-800 p-8 md:p-12 overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-4">
            <Shield className="w-8 h-8 text-white" />
            <h1 className="text-4xl font-display font-bold text-white">BUG BOUNTY PROGRAM</h1>
          </div>

          <div className="space-y-8 text-gray-300 font-sans leading-relaxed">
            <div className="flex gap-4 items-start">
              <Terminal className="w-6 h-6 text-gray-400 mt-1 shrink-0" />
              <div>
                <h2 className="text-xl font-bold font-display text-white mb-2">What to report</h2>
                <p>
                  Found a vulnerability, leaked credentials, exposed documents, or other sensitive
                  data tied to me? Let me know. I want to keep my systems secure and I appreciate
                  the help.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <Gift className="w-6 h-6 text-gray-400 mt-1 shrink-0" />
              <div>
                <h2 className="text-xl font-bold font-display text-white mb-2">Rewards</h2>
                <p>
                  Valid, verified reports earn <strong>gift cards</strong>. The amount depends on
                  the severity and impact of what you find.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <Mail className="w-6 h-6 text-gray-400 mt-1 shrink-0" />
              <div>
                <h2 className="text-xl font-bold font-display text-white mb-2">How to report</h2>
                <p>
                  Send your findings to{' '}
                  <a
                    href={`mailto:${config.authorEmail}?subject=[Bug Bounty]`}
                    className="text-white hover:text-gray-300 font-mono underline underline-offset-4 transition-colors"
                  >
                    {config.authorEmail}
                  </a>{' '}
                  with the subject line{' '}
                  <code className="bg-gray-800 px-2 py-1 rounded text-gray-200">[Bug Bounty]</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BugBounty;
