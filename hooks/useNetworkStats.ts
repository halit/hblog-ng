import { useState, useEffect, useRef } from 'react';

export interface NetworkStats {
  /** Current RX (download) throughput in B/s. */
  rx: number;
  /** Current TX (upload) throughput in B/s. */
  tx: number;
  /** True while real page activity is driving RX above the idle floor. */
  rxActive: boolean;
  /** True while real user interaction is driving TX above the idle floor. */
  txActive: boolean;
}

// Idle baseline: a low, always-present hum so the readout never sits at 0 and
// never lights up. Two detuned sines give it an organic, non-repeating wander
// without any randomness, so the noise is deterministic between renders.
const IDLE_RX_BASE = 42;
const IDLE_RX_AMP = 24;
const IDLE_TX_BASE = 26;
const IDLE_TX_AMP = 15;

// Activity "energy" injected by real events decays toward 0 each tick, so a
// spike fades over ~1s instead of vanishing instantly.
const DECAY = 0.82;

// Activity (excluding idle noise) above this many B/s lights the channel up
// in its accent color. Idle noise stays below it, so idle stays gray.
const ACTIVE_THRESHOLD = 60;

const TICK_MS = 120;

export const useNetworkStats = (): NetworkStats => {
  const [stats, setStats] = useState<NetworkStats>({
    rx: 0,
    tx: 0,
    rxActive: false,
    txActive: false,
  });

  // Activity energy injected by real events; decays every tick.
  const rxEnergy = useRef(0);
  const txEnergy = useRef(0);
  // Monotonic tick counter drives the deterministic sine-based idle noise.
  const tick = useRef(0);

  useEffect(() => {
    const step = () => {
      const t = (tick.current += 1);

      // Deterministic, smoothly wandering idle floor (never 0).
      const idleRx =
        IDLE_RX_BASE + IDLE_RX_AMP * (Math.sin(t * 0.07) * 0.6 + Math.sin(t * 0.017 + 1.3) * 0.4);
      const idleTx =
        IDLE_TX_BASE + IDLE_TX_AMP * (Math.sin(t * 0.09 + 2.1) * 0.6 + Math.sin(t * 0.023) * 0.4);

      // Decay injected activity back toward the idle floor.
      rxEnergy.current = rxEnergy.current < 1 ? 0 : rxEnergy.current * DECAY;
      txEnergy.current = txEnergy.current < 1 ? 0 : txEnergy.current * DECAY;

      const rxAct = rxEnergy.current;
      const txAct = txEnergy.current;

      setStats({
        rx: Math.max(1, idleRx + rxAct),
        tx: Math.max(1, idleTx + txAct),
        rxActive: rxAct > ACTIVE_THRESHOLD,
        txActive: txAct > ACTIVE_THRESHOLD,
      });
    };

    const interval = setInterval(step, TICK_MS);

    // RX: real bytes coming down from resource + navigation traffic. Receiving
    // data lights up RX; the request that fetched it adds a little TX.
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        const rxBytes =
          resource.transferSize > 0
            ? resource.transferSize
            : resource.encodedBodySize > 0
              ? resource.encodedBodySize + 300
              : 200;

        rxEnergy.current += rxBytes;
        txEnergy.current += (resource.name?.length ?? 50) + 400;
        if (entry.entryType === 'navigation') rxEnergy.current += 800;
      }
      step();
    });

    try {
      observer.observe({ type: 'resource', buffered: true });
      observer.observe({ type: 'navigation', buffered: true });
    } catch {
      console.warn('PerformanceObserver not supported');
    }

    // TX: user interaction = bytes we send. A click/keystroke spikes TX first
    // (the request leaving), then the resources it pulls back spike RX. The
    // bump varies deterministically by tick so repeated clicks aren't identical.
    const onInteract = () => {
      txEnergy.current += 440 + (tick.current % 7) * 30;
      step();
    };
    window.addEventListener('pointerdown', onInteract, { passive: true });
    window.addEventListener('keydown', onInteract, { passive: true });

    step();

    return () => {
      clearInterval(interval);
      observer.disconnect();
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
    };
  }, []);

  return stats;
};
