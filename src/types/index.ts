export interface LyricLine {
  id: string;
  startTime: number; // in milliseconds
  endTime: number; // in milliseconds
  text: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  youtubeVideoId: string;
  lyrics: LyricLine[];
}

export interface YouTubePlayer {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number): void;
}

// YouTube Player States
export const YT_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

export type YTPlayerState = typeof YT_PLAYER_STATE[keyof typeof YT_PLAYER_STATE];
