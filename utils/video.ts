export type VideoType = 'youtube' | 'vimeo' | 'asciinema' | 'local' | 'unknown';

export interface VideoInfo {
  type: VideoType;
  id?: string;
  embedUrl: string;
}

export const getVideoInfo = (src: string): VideoInfo => {
  if (!src) return { type: 'unknown', embedUrl: src };

  // YouTube
  if (src.includes('youtube.com') || src.includes('youtu.be')) {
    const videoId = src.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    )?.[1];
    if (videoId) {
      return {
        type: 'youtube',
        id: videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };
    }
  }

  // Vimeo
  if (src.includes('vimeo.com')) {
    const videoId = src.match(
      /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/,
    )?.[1];
    if (videoId) {
      return {
        type: 'vimeo',
        id: videoId,
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
      };
    }
  }

  // Asciinema
  if (src.includes('asciinema.org') || src.endsWith('.cast')) {
    // Handle direct .cast files or asciinema.org URLs
    if (src.includes('asciinema.org/a/')) {
      const videoId = src.match(/asciinema\.org\/a\/([a-zA-Z0-9-]+)/)?.[1];
      if (videoId) {
        return {
          type: 'asciinema',
          id: videoId,
          embedUrl: `https://asciinema.org/a/${videoId}.cast`,
        };
      }
    }
    // Direct .cast URL
    if (src.endsWith('.cast')) {
      return {
        type: 'asciinema',
        embedUrl: src,
      };
    }
  }

  // Local / Generic
  if (!src.startsWith('http') && !src.startsWith('/')) {
    // Default to /videos/ if relative path provided
    return {
      type: 'local',
      embedUrl: `/videos/${src}`,
    };
  }

  return {
    type: 'local',
    embedUrl: src,
  };
};
