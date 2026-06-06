import { useState, useEffect, useRef } from 'react';

interface NetworkEvent {
  time: number;
  rx: number;
  tx: number;
}

export const useNetworkStats = () => {
  const [stats, setStats] = useState({ rx: 0, tx: 0 });
  // Store recent network events to calculate rolling throughput
  const eventLog = useRef<NetworkEvent[]>([]);

  useEffect(() => {
    const updateStats = () => {
      const now = performance.now();
      // Calculate throughput over the last 1000ms (1 second window)
      const windowStart = now - 1000;

      // 1. Prune events older than the window
      // We keep them strictly within the window to calculate "Bytes per Second"
      eventLog.current = eventLog.current.filter((e) => e.time >= windowStart);

      // 2. Sum up bytes in the current window
      let rxSum = 0;
      let txSum = 0;

      for (const event of eventLog.current) {
        rxSum += event.rx;
        txSum += event.tx;
      }

      // 3. Add base noise (simulated background traffic)
      // This makes the UI feel alive even when idle
      const noiseRx = Math.random() * 120;
      const noiseTx = Math.random() * 80;

      setStats({
        rx: rxSum + noiseRx,
        tx: txSum + noiseTx,
      });
    };

    // Update UI frequently (5Hz) for smooth responsiveness
    const interval = setInterval(updateStats, 200);

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        const resource = entry as PerformanceResourceTiming;
        // We use responseEnd as the time the bytes were fully received
        // If responseEnd is not available (0), use startTime + duration, or just startTime
        const endTime =
          resource.responseEnd || resource.startTime + resource.duration || resource.startTime;

        let rxBytes = 0;

        if (typeof resource.transferSize === 'number' && resource.transferSize > 0) {
          rxBytes = resource.transferSize;
        } else {
          // Cross-origin or cached - estimate
          if (typeof resource.encodedBodySize === 'number' && resource.encodedBodySize > 0) {
            rxBytes = resource.encodedBodySize + 300;
          } else {
            rxBytes = 200; // Fallback minimal size
          }
        }

        // TX Estimate
        const urlLen = resource.name ? resource.name.length : 50;
        const estimatedTx = urlLen + 400 + Math.random() * 100; // Headers/Cookies

        let txBytes = estimatedTx;
        if (entry.entryType === 'navigation') {
          txBytes += 800;
        }

        eventLog.current.push({
          time: endTime,
          rx: rxBytes,
          tx: txBytes,
        });
      });

      // If we receive new data, update immediately to feel responsive
      updateStats();
    });

    try {
      observer.observe({ type: 'resource', buffered: true });
      observer.observe({ type: 'navigation', buffered: true });
      // Also observe XHR/Fetch if possible via resource, but resource covers most
    } catch {
      console.warn('PerformanceObserver not supported');
    }

    // Run an immediate update to catch any already-buffered events on mount
    updateStats();

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return stats;
};
