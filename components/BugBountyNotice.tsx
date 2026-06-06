'use client';

import { useEffect } from 'react';
import { config } from '@/config/env';

export default function BugBountyNotice() {
  useEffect(() => {
    const art = `
  _     _     _                                     
 | |__ | |__ | | ___   __ _      _ __   __ _      
 | '_ \\| '_ \\| |/ _ \\ / _\` |____| '_ \\ / _\` |     
 | | | | |_) | | (_) | (_| |____| | | | (_| |     
 |_| |_|_.__/|_|\\___/ \\__, |    |_| |_|\\__, |     
                      |___/            |___/      
     v${config.appVersion}
`;
    const msg = `\nHey hacker! \nI have a specific page for bug bounty, please go and read it: ${config.siteUrl}/bug-bounty\n`;

    console.log(`%c${art}`, 'color: #ff0055; font-weight: bold;');
    console.log(`%c${msg}`, 'color: #00ff00; font-size: 12px;');
  }, []);

  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `<!-- 
  _     _     _                                     
 | |__ | |__ | | ___   __ _      _ __   __ _      
 | '_ \\| '_ \\| |/ _ \\ / _\` |____| '_ \\ / _\` |     
 | | | | |_) | | (_) | (_| |____| | | | (_| |     
 |_| |_|_.__/|_|\\___/ \\__, |    |_| |_|\\__, |     
                      |___/            |___/      
 v${config.appVersion}

 Hey hacker! 
 I have a specific page for bug bounty, please go and read it: ${config.siteUrl}/bug-bounty
    -->`,
      }}
      style={{ display: 'none' }}
    />
  );
}
