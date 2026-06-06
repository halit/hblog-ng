declare module 'asciinema-player' {
  export function create(
    src: string,
    element: HTMLElement | null,
    options?: {
      cols?: number;
      rows?: number;
      autoPlay?: boolean;
      preload?: boolean;
      loop?: boolean;
      startAt?: number | string;
      speed?: number;
      idleTimeLimit?: number;
      theme?: string;
      poster?: string;
      fit?: string | boolean;
      fontSize?: string;
      controls?: boolean | 'auto';
    },
  ): {
    dispose: () => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    play: () => void;
    pause: () => void;
    seek: (location: number | { marker: 'prev' | 'next' }) => void;
  };
}
