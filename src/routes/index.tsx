import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react';
import YouTubePlayerComponent from '@/components/YouTubePlayer';
import LyricsDisplay from '@/components/LyricsDisplay';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import type { LyricLine, Song } from '@/types';
import { YT_PLAYER_STATE } from '@/types';
import LyricsEditor from '@/components/LyricsEditor';

const App: React.FC = () => {
  const [currentSong, setCurrentSong] = useState<Song>({
    id: 'custom',
    title: 'Custom Song',
    artist: 'Unknown Artist',
    youtubeVideoId: '',
    lyrics: []
  });
  const [videoId, setVideoId] = useState('');
  const [showEditor, setShowEditor] = useState(true); // Start with editor open for new songs
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [selectedLyrics, setSelectedLyrics] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showJsonViewer, setShowJsonViewer] = useState(false);

  const {
    playerState,
    currentTime,
    duration,
    isReady,
    handlePlayerReady,
    handleStateChange,
    handleTimeUpdate,
    togglePlayPause,
    seekTo,
  } = useYouTubePlayer({ loopStart, loopEnd, isLooping });

  const handleLyricClick = (startTime: number) => {
    seekTo(startTime);
  };

  const handleLyricsChange = (newLyrics: LyricLine[]) => {
    setLyrics(newLyrics);
    setCurrentSong(prev => ({ ...prev, lyrics: newLyrics }));
  };

  const handleVideoIdChange = (newVideoId: string) => {
    const previousVideoId = currentSong.youtubeVideoId;
    setVideoId(newVideoId);
    setCurrentSong(prev => ({ ...prev, youtubeVideoId: newVideoId }));
    // Clear existing lyrics when loading new video
    if (newVideoId !== previousVideoId) {
      setLyrics([]);
      setCurrentSong(prevSong => ({ ...prevSong, lyrics: [] }));
      clearLoop();
    }
  };

  const handleSongDetailsChange = (field: string, value: string) => {
    setCurrentSong(prev => ({ ...prev, [field]: value }));
  };

  const loadSampleData = () => {
    // You can add sample data loading here if needed
    const sampleSong = {
      id: 'sample',
      title: 'Sample Song',
      artist: 'Sample Artist',
      youtubeVideoId: 'dQw4w9WgXcQ', // Rick Astley example
      lyrics: []
    };
    setCurrentSong(sampleSong);
    setVideoId(sampleSong.youtubeVideoId);
    setLyrics(sampleSong.lyrics);
  };

  const startNewSong = () => {
    const newSong = {
      id: 'new-' + Date.now(),
      title: 'New Song',
      artist: 'Unknown Artist',
      youtubeVideoId: '',
      lyrics: []
    };
    setCurrentSong(newSong);
    setVideoId('');
    setLyrics([]);
    clearLoop();
    setShowEditor(true);
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeWithMilliseconds = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const ms = Math.floor(milliseconds % 1000);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const copyCurrentTimeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(Math.floor(currentTime).toString());
      // You could add a toast notification here
      console.log('Current time copied to clipboard:', Math.floor(currentTime));
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const setLoopFromLyric = (lyric: LyricLine) => {
    setLoopStart(lyric.startTime);
    setLoopEnd(lyric.endTime);
    setIsLooping(true);
    setSelectedLyrics([lyric.id]);
    setIsMultiSelectMode(false);
  };

  const setLoopFromMultipleLyrics = () => {
    if (selectedLyrics.length === 0) return;
    
    const selectedLyricObjects = lyrics.filter(lyric => selectedLyrics.includes(lyric.id));
    if (selectedLyricObjects.length === 0) return;
    
    // Sort by start time to get the correct range
    const sortedLyrics = selectedLyricObjects.sort((a, b) => a.startTime - b.startTime);
    const firstLyric = sortedLyrics[0];
    const lastLyric = sortedLyrics[sortedLyrics.length - 1];
    
    setLoopStart(firstLyric.startTime);
    setLoopEnd(lastLyric.endTime);
    setIsLooping(true);
  };

  const toggleLyricSelection = (lyricId: string) => {
    setSelectedLyrics(prev => {
      if (prev.includes(lyricId)) {
        return prev.filter(id => id !== lyricId);
      } else {
        return [...prev, lyricId];
      }
    });
  };

  const clearSelection = () => {
    setSelectedLyrics([]);
    setIsMultiSelectMode(false);
  };

  const clearLoop = () => {
    setLoopStart(null);
    setLoopEnd(null);
    setIsLooping(false);
    setSelectedLyrics([]);
    setIsMultiSelectMode(false);
  };

  const copyLyricsAsJson = async () => {
    const jsonData = {
      song: {
        title: currentSong.title,
        artist: currentSong.artist,
        youtubeVideoId: currentSong.youtubeVideoId,
      },
      lyrics: lyrics.map(lyric => ({
        id: lyric.id,
        text: lyric.text,
        startTime: lyric.startTime,
        endTime: lyric.endTime,
        startTimeFormatted: formatTimeWithMilliseconds(lyric.startTime),
        endTimeFormatted: formatTimeWithMilliseconds(lyric.endTime),
      })),
      metadata: {
        totalLyrics: lyrics.length,
        duration: duration,
        exportedAt: new Date().toISOString(),
      }
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      console.log('Lyrics JSON copied to clipboard');
    } catch (err) {
      console.error('Failed to copy JSON to clipboard:', err);
    }
  };

  const downloadLyricsAsJson = () => {
    const jsonData = {
      song: {
        title: currentSong.title,
        artist: currentSong.artist,
        youtubeVideoId: currentSong.youtubeVideoId,
      },
      lyrics: lyrics.map(lyric => ({
        id: lyric.id,
        text: lyric.text,
        startTime: lyric.startTime,
        endTime: lyric.endTime,
        startTimeFormatted: formatTimeWithMilliseconds(lyric.startTime),
        endTimeFormatted: formatTimeWithMilliseconds(lyric.endTime),
      })),
      metadata: {
        totalLyrics: lyrics.length,
        duration: duration,
        exportedAt: new Date().toISOString(),
      }
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSong.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_lyrics.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const setLoopStartAtCurrentTime = () => {
    setLoopStart(currentTime);
    if (loopEnd === null || currentTime >= loopEnd) {
      setLoopEnd(currentTime + 10000); // Default 10 seconds
    }
  };

  const setLoopEndAtCurrentTime = () => {
    setLoopEnd(currentTime);
    if (loopStart === null || currentTime <= loopStart) {
      setLoopStart(Math.max(0, currentTime - 10000)); // Default 10 seconds before
    }
  };

  const getPlayerStateText = () => {
    switch (playerState) {
      case YT_PLAYER_STATE.PLAYING:
        return 'Playing';
      case YT_PLAYER_STATE.PAUSED:
        return 'Paused';
      case YT_PLAYER_STATE.BUFFERING:
        return 'Buffering';
      case YT_PLAYER_STATE.ENDED:
        return 'Ended';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            🎵 YouTube Lyric Tracker
          </h1>
          <p className="text-center text-gray-400">
            Synchronize lyrics with YouTube videos in real-time
          </p>
        </header>

        {/* Video ID Input */}
        <div className="mb-6 bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Song Setup</h2>
            <div className="flex space-x-2">
              <button
                onClick={startNewSong}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                🆕 New Song
              </button>
              <button
                onClick={loadSampleData}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                📝 Load Sample
              </button>
            </div>
          </div>
          
          {/* Song Details Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Song Title:</label>
              <input
                type="text"
                value={currentSong.title}
                onChange={(e) => handleSongDetailsChange('title', e.target.value)}
                placeholder="Enter song title"
                className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Artist:</label>
              <input
                type="text"
                value={currentSong.artist}
                onChange={(e) => handleSongDetailsChange('artist', e.target.value)}
                placeholder="Enter artist name"
                className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          
          <label className="block text-sm font-medium mb-2">YouTube Video ID or URL:</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={videoId}
              onChange={(e) => {
                const value = e.target.value;
                // Extract video ID from full YouTube URL if provided
                const match = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
                const extractedId = match ? match[1] : value;
                setVideoId(extractedId);
              }}
              placeholder="Enter YouTube video ID or full URL"
              className="flex-1 p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={() => handleVideoIdChange(videoId)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Load Video
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Video Player */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-semibold mb-4">{currentSong.title}</h2>
              <p className="text-gray-400 mb-4">by {currentSong.artist}</p>
              
              <div className="mb-4">
                {currentSong.youtubeVideoId ? (
                  <YouTubePlayerComponent
                    videoId={currentSong.youtubeVideoId}
                    onReady={handlePlayerReady}
                    onStateChange={handleStateChange}
                    onTimeUpdate={handleTimeUpdate}
                    width="100%"
                    height="315"
                  />
                ) : (
                  <div className="bg-gray-700 rounded-lg p-8 text-center">
                    <div className="text-6xl mb-4">🎵</div>
                    <h3 className="text-lg font-medium mb-2">No Video Loaded</h3>
                    <p className="text-gray-400 text-sm">
                      Enter a YouTube video ID or URL above to get started
                    </p>
                  </div>
                )}
              </div>

              {/* Player Controls */}
              <div className="player-controls bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={togglePlayPause}
                    disabled={!isReady}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-medium"
                  >
                    {playerState === YT_PLAYER_STATE.PLAYING ? '⏸️ Pause' : '▶️ Play'}
                  </button>
                  <div className="text-sm text-gray-300">
                    Status: <span className="font-medium">{getPlayerStateText()}</span>
                  </div>
                </div>
                
                {/* Loop Controls */}
                <div className="mb-3 p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-300">Loop Controls</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                        className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                          isMultiSelectMode 
                            ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                            : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                        }`}
                      >
                        📝 Multi-Select
                      </button>
                      <button
                        onClick={() => setIsLooping(!isLooping)}
                        className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                          isLooping 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                        }`}
                      >
                        🔄 {isLooping ? 'ON' : 'OFF'}
                      </button>
                      <button
                        onClick={clearLoop}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  {isMultiSelectMode && (
                    <div className="mb-3 p-2 bg-orange-900/20 border border-orange-500/30 rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-orange-300">
                          Multi-select mode active. Selected: {selectedLyrics.length} lyrics
                        </span>
                        <div className="flex space-x-1">
                          <button
                            onClick={setLoopFromMultipleLyrics}
                            disabled={selectedLyrics.length === 0}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-2 py-1 rounded text-xs"
                          >
                            Loop Selected
                          </button>
                          <button
                            onClick={clearSelection}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
                          >
                            Clear Selection
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(loopStart !== null || loopEnd !== null) && (
                    <div className="text-xs text-gray-400 mb-2">
                      Loop: {loopStart !== null ? formatTimeWithMilliseconds(loopStart) : '--:--'} → {loopEnd !== null ? formatTimeWithMilliseconds(loopEnd) : '--:--'}
                      {selectedLyrics.length > 1 && (
                        <span className="text-purple-400 ml-2">({selectedLyrics.length} lyrics)</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={setLoopStartAtCurrentTime}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium"
                    >
                      📍 Start
                    </button>
                    <button
                      onClick={setLoopEndAtCurrentTime}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium"
                    >
                      🏁 End
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span className="font-mono">{formatTimeWithMilliseconds(currentTime)}</span>
                  <div className="flex-1 mx-4 bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                      style={{
                        width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                      }}
                    />
                  </div>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Lyrics Display */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Lyrics</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowJsonViewer(!showJsonViewer)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    {showJsonViewer ? '🎵 View Lyrics' : '📄 JSON View'}
                  </button>
                  <button
                    onClick={() => setShowEditor(!showEditor)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    {showEditor ? '👁️ View Mode' : '✏️ Edit Mode'}
                  </button>
                </div>
              </div>
              
              {showJsonViewer ? (
                <div className="space-y-4">
                  {/* JSON Export Controls */}
                  <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                    <span className="text-sm text-gray-300">Export lyrics data</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={copyLyricsAsJson}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium"
                      >
                        📋 Copy JSON
                      </button>
                      <button
                        onClick={downloadLyricsAsJson}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium"
                      >
                        💾 Download JSON
                      </button>
                    </div>
                  </div>

                  {/* JSON Viewer */}
                  <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto">
                    <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
                      {JSON.stringify({
                        song: {
                          title: currentSong.title,
                          artist: currentSong.artist,
                          youtubeVideoId: currentSong.youtubeVideoId,
                        },
                        lyrics: lyrics.map(lyric => ({
                          id: lyric.id,
                          text: lyric.text,
                          startTime: lyric.startTime,
                          endTime: lyric.endTime,
                          startTimeFormatted: formatTimeWithMilliseconds(lyric.startTime),
                          endTimeFormatted: formatTimeWithMilliseconds(lyric.endTime),
                        })),
                        metadata: {
                          totalLyrics: lyrics.length,
                          duration: duration,
                          exportedAt: new Date().toISOString(),
                        }
                      }, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : lyrics.length > 0 ? (
                <LyricsDisplay
                  lyrics={lyrics}
                  currentTime={currentTime}
                  onLyricClick={handleLyricClick}
                  onSetLoop={setLoopFromLyric}
                  onToggleSelection={toggleLyricSelection}
                  loopStart={loopStart}
                  loopEnd={loopEnd}
                  isLooping={isLooping}
                  selectedLyrics={selectedLyrics}
                  isMultiSelectMode={isMultiSelectMode}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-medium mb-2">No Lyrics Yet</h3>
                  <p className="text-gray-400 mb-4">
                    Start by loading a video, then use Edit Mode to add lyrics with precise timing.
                  </p>
                  <button
                    onClick={() => setShowEditor(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                  >
                    ✏️ Start Adding Lyrics
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Lyrics Editor */}
          <div className="space-y-6">
            {showEditor && (
              <LyricsEditor
                lyrics={lyrics}
                currentTime={currentTime}
                onLyricsChange={handleLyricsChange}
                onSetLoop={setLoopFromLyric}
                selectedLyrics={selectedLyrics}
                isMultiSelectMode={isMultiSelectMode}
                onToggleSelection={toggleLyricSelection}
              />
            )}

            {/* Info Panel */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">How to Use</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">1.</span>
                  <p>Click "🆕 New Song" to start fresh, or "📝 Load Sample" for an example</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">2.</span>
                  <p>Enter the song title, artist name, and YouTube video ID or URL</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">3.</span>
                  <p>Click "Load Video" to load the video player</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">4.</span>
                  <p>The lyrics area will be empty - click "✏️ Start Adding Lyrics" or use Edit Mode</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">5.</span>
                  <p>Play the video and add lyrics at the current timestamp</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">6.</span>
                  <p>Click on any lyric line to jump to that moment in the video</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">7.</span>
                  <p>Use loop controls to practice specific sections:</p>
                </div>
                <div className="ml-6 space-y-2 text-xs text-gray-400">
                  <div>• Set manual start/end points with "📍 Start" and "🏁 End" buttons</div>
                  <div>• Click "🔄 Loop" on any single lyric for instant looping</div>
                  <div>• Enable "📝 Multi-Select" mode to select multiple lyrics and loop entire sections</div>
                  <div>• Use "Loop Selected" to loop all selected lyrics at once</div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">8.</span>
                  <p>Export your work using "📄 JSON View" to copy or download the lyric data</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">9.</span>
                  <p>Watch as lyrics highlight in sync with the music!</p>
                </div>
              </div>
            </div>

            {/* Current Stats */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Stats & Real-time Info</h3>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 mb-2">Current Time (for editing)</div>
                  <div 
                    className="text-2xl font-mono font-bold text-green-400 bg-gray-900 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-800 transition-colors"
                    onClick={copyCurrentTimeToClipboard}
                    title="Click to copy milliseconds to clipboard"
                  >
                    {formatTimeWithMilliseconds(currentTime)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    Click to copy: {Math.floor(currentTime)}ms
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-gray-400">Total Lyrics</div>
                    <div className="text-2xl font-bold text-blue-400">{lyrics.length}</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-gray-400">Player Status</div>
                    <div className="text-lg font-medium text-purple-400">{getPlayerStateText()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export const Route = createFileRoute('/')({
  component: App,
})
export default App;