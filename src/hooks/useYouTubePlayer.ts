import { useState, useCallback } from 'react';
import type { YouTubePlayer, YTPlayerState } from '../types';
import { YT_PLAYER_STATE } from '../types';

interface UseYouTubePlayerProps {
  loopStart?: number | null;
  loopEnd?: number | null;
  isLooping?: boolean;
}

export const useYouTubePlayer = ({ loopStart, loopEnd, isLooping }: UseYouTubePlayerProps = {}) => {
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [playerState, setPlayerState] = useState<YTPlayerState>(YT_PLAYER_STATE.UNSTARTED);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);

  const handlePlayerReady = useCallback((ytPlayer: YouTubePlayer) => {
    setPlayer(ytPlayer);
    setIsReady(true);
    try {
      setDuration(ytPlayer.getDuration() * 1000); // Convert to milliseconds
    } catch (error) {
      console.warn('Could not get video duration:', error);
    }
  }, []);

  const handleStateChange = useCallback((state: YTPlayerState) => {
    setPlayerState(state);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    
    // Handle looping logic
    if (isLooping && 
        typeof loopStart === 'number' && 
        typeof loopEnd === 'number' && 
        loopStart < loopEnd) {
      if (time >= loopEnd) {
        // Loop back to start
        if (player && isReady) {
          try {
            player.seekTo(loopStart / 1000);
          } catch (error) {
            console.warn('Could not loop to start time:', error);
          }
        }
      }
    }
  }, [isLooping, loopStart, loopEnd, player, isReady]);

  const playVideo = useCallback(() => {
    if (player && isReady) {
      try {
        player.playVideo();
      } catch (error) {
        console.warn('Could not play video:', error);
      }
    }
  }, [player, isReady]);

  const pauseVideo = useCallback(() => {
    if (player && isReady) {
      try {
        player.pauseVideo();
      } catch (error) {
        console.warn('Could not pause video:', error);
      }
    }
  }, [player, isReady]);

  const seekTo = useCallback((timeInMs: number) => {
    if (player && isReady) {
      try {
        player.seekTo(timeInMs / 1000); // Convert milliseconds to seconds
      } catch (error) {
        console.warn('Could not seek to time:', error);
      }
    }
  }, [player, isReady]);

  const togglePlayPause = useCallback(() => {
    if (playerState === YT_PLAYER_STATE.PLAYING) {
      pauseVideo();
    } else {
      playVideo();
    }
  }, [playerState, playVideo, pauseVideo]);

  return {
    player,
    playerState,
    currentTime,
    duration,
    isReady,
    handlePlayerReady,
    handleStateChange,
    handleTimeUpdate,
    playVideo,
    pauseVideo,
    seekTo,
    togglePlayPause,
  };
};
