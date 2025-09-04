import type { Song } from '../types';

export const sampleSongs: Song[] = [
  {
    id: '1',
    title: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    youtubeVideoId: 'dQw4w9WgXcQ',
    lyrics: [
      {
        id: '1',
        startTime: 17000,
        endTime: 20000,
        text: "We're no strangers to love"
      },
      {
        id: '2',
        startTime: 20000,
        endTime: 23500,
        text: "You know the rules and so do I"
      },
      {
        id: '3',
        startTime: 23500,
        endTime: 27000,
        text: "A full commitment's what I'm thinking of"
      },
      {
        id: '4',
        startTime: 27000,
        endTime: 30500,
        text: "You wouldn't get this from any other guy"
      },
      {
        id: '5',
        startTime: 31000,
        endTime: 33000,
        text: "I just wanna tell you how I'm feeling"
      },
      {
        id: '6',
        startTime: 33000,
        endTime: 36000,
        text: "Gotta make you understand"
      },
      {
        id: '7',
        startTime: 36500,
        endTime: 38500,
        text: "Never gonna give you up"
      },
      {
        id: '8',
        startTime: 38500,
        endTime: 41000,
        text: "Never gonna let you down"
      },
      {
        id: '9',
        startTime: 41000,
        endTime: 43500,
        text: "Never gonna run around and desert you"
      },
      {
        id: '10',
        startTime: 43500,
        endTime: 46000,
        text: "Never gonna make you cry"
      },
      {
        id: '11',
        startTime: 46000,
        endTime: 48500,
        text: "Never gonna say goodbye"
      },
      {
        id: '12',
        startTime: 48500,
        endTime: 51500,
        text: "Never gonna tell a lie and hurt you"
      }
    ]
  },
  {
    id: '2',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    youtubeVideoId: 'fJ9rUzIMcZQ',
    lyrics: [
      {
        id: 'br1',
        startTime: 7000,
        endTime: 10000,
        text: "Is this the real life?"
      },
      {
        id: 'br2',
        startTime: 10000,
        endTime: 13000,
        text: "Is this just fantasy?"
      },
      {
        id: 'br3',
        startTime: 13000,
        endTime: 16000,
        text: "Caught in a landslide"
      },
      {
        id: 'br4',
        startTime: 16000,
        endTime: 20000,
        text: "No escape from reality"
      },
      {
        id: 'br5',
        startTime: 20000,
        endTime: 23000,
        text: "Open your eyes"
      },
      {
        id: 'br6',
        startTime: 23000,
        endTime: 26000,
        text: "Look up to the skies and see"
      }
    ]
  }
];

export const getEmptySong = (): Song => ({
  id: `song-${Date.now()}`,
  title: 'New Song',
  artist: 'Unknown Artist',
  youtubeVideoId: '',
  lyrics: []
});

export const exportLyrics = (song: Song): string => {
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;
    
    return `[${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${Math.floor(milliseconds / 10)
      .toString()
      .padStart(2, '0')}]`;
  };

  const lyricsText = song.lyrics
    .sort((a, b) => a.startTime - b.startTime)
    .map(lyric => `${formatTime(lyric.startTime)} ${lyric.text}`)
    .join('\n');

  return `${song.title} - ${song.artist}\nYouTube: https://youtube.com/watch?v=${song.youtubeVideoId}\n\n${lyricsText}`;
};

export const importLyrics = (text: string): { title?: string; artist?: string; videoId?: string; lyrics: Array<{ startTime: number; text: string }> } => {
  const lines = text.split('\n').filter(line => line.trim());
  const lyrics: Array<{ startTime: number; text: string }> = [];
  let title: string | undefined;
  let artist: string | undefined;
  let videoId: string | undefined;

  for (const line of lines) {
    // Check for title/artist line
    if (line.includes(' - ') && !line.startsWith('[')) {
      const parts = line.split(' - ');
      title = parts[0].trim();
      artist = parts[1].trim();
      continue;
    }

    // Check for YouTube URL
    if (line.includes('youtube.com/watch?v=') || line.includes('youtu.be/')) {
      const match = line.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (match) {
        videoId = match[1];
      }
      continue;
    }

    // Check for lyric lines with timestamp
    const timestampMatch = line.match(/^\[(\d{1,2}):(\d{2})\.(\d{2})\]\s*(.+)$/);
    if (timestampMatch) {
      const minutes = parseInt(timestampMatch[1]);
      const seconds = parseInt(timestampMatch[2]);
      const centiseconds = parseInt(timestampMatch[3]);
      const text = timestampMatch[4];
      
      const startTime = (minutes * 60 + seconds) * 1000 + centiseconds * 10;
      lyrics.push({ startTime, text });
    }
  }

  return { title, artist, videoId, lyrics };
};
