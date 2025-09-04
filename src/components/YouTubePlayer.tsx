import React, { useEffect, useRef, useState } from 'react';
import type { YouTubePlayer, YTPlayerState } from '../types';

interface YouTubePlayerProps {
  videoId: string;
  onReady?: (player: YouTubePlayer) => void;
  onStateChange?: (state: YTPlayerState) => void;
  onTimeUpdate?: (currentTime: number) => void;
  height?: string;
  width?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YouTubePlayerComponent: React.FC<YouTubePlayerProps> = ({
  videoId,
  onReady,
  onStateChange,
  onTimeUpdate,
  height = '360',
  width = '640',
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);

      window.onYouTubeIframeAPIReady = () => {
        setIsAPIReady(true);
      };
    } else {
      setIsAPIReady(true);
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying YouTube player:', error);
        }
      }
    };
  }, []);

  // Initialize player when API is ready
  useEffect(() => {
    if (isAPIReady && containerRef.current && !playerRef.current) {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height,
        width,
        videoId,
        playerVars: {
          playsinline: 1,
          controls: 1,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event: any) => {
            const ytPlayer = event.target as YouTubePlayer;
            setPlayer(ytPlayer);
            onReady?.(ytPlayer);
          },
          onStateChange: (event: any) => {
            onStateChange?.(event.data);
          },
        },
      });
    }
  }, [isAPIReady, videoId, height, width, onReady, onStateChange]);

  // Time update interval
  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      try {
        const currentTime = player.getCurrentTime() * 1000; // Convert to milliseconds
        onTimeUpdate?.(Math.floor(currentTime)); // Floor to avoid floating point precision issues
      } catch (error) {
        // Player might not be ready yet
      }
    }, 50); // Update every 50ms for smoother millisecond tracking

    return () => clearInterval(interval);
  }, [player, onTimeUpdate]);

  return (
    <div className="youtube-player-container">
      <div ref={containerRef} className="rounded-lg overflow-hidden shadow-lg" />
    </div>
  );
};

export default YouTubePlayerComponent;
