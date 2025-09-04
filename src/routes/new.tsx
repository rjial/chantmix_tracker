import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from 'react';
import YouTubePlayerComponent from '@/components/YouTubePlayer';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import type { LyricLine } from '@/types';
import { YT_PLAYER_STATE } from '@/types';

const NewPage = () => {
  const [videoId, setVideoId] = useState('');
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyricText, setCurrentLyricText] = useState('');
  const [isEditorMode, setIsEditorMode] = useState(true);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [lyricStartTime, setLyricStartTime] = useState<number | null>(null);
  const [editingLyric, setEditingLyric] = useState<LyricLine | null>(null);
  const [showJsonLoader, setShowJsonLoader] = useState(false);

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
  } = useYouTubePlayer({ loopStart: null, loopEnd: null, isLooping: false });

  const formatTimeWithMilliseconds = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const ms = Math.floor(milliseconds % 1000);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const handleVideoLoad = () => {
    if (videoId.trim()) {
      // Extract video ID from URL if needed
      const match = videoId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
      const extractedId = match ? match[1] : videoId;
      setVideoId(extractedId);
    }
  };

  const addLyric = () => {
    if (currentLyricText.trim()) {
      const startTime = lyricStartTime !== null ? lyricStartTime : currentTime;
      const endTime = currentTime;
      
      const newLyric: LyricLine = {
        id: Date.now().toString(),
        text: currentLyricText.trim(),
        startTime: startTime,
        endTime: endTime > startTime ? endTime : startTime + 3000, // Ensure end is after start
      };
      setLyrics(prev => [...prev, newLyric].sort((a, b) => a.startTime - b.startTime));
      setCurrentLyricText('');
      setLyricStartTime(null); // Reset start time after adding
    }
  };

  const markStartTime = () => {
    setLyricStartTime(currentTime);
  };

  const editLyric = (lyric: LyricLine) => {
    setEditingLyric(lyric);
    setCurrentLyricText(lyric.text);
    setLyricStartTime(lyric.startTime);
  };

  const updateLyric = () => {
    if (editingLyric && currentLyricText.trim()) {
      const startTime = lyricStartTime !== null ? lyricStartTime : editingLyric.startTime;
      const endTime = currentTime;
      
      const updatedLyric: LyricLine = {
        ...editingLyric,
        text: currentLyricText.trim(),
        startTime: startTime,
        endTime: endTime > startTime ? endTime : startTime + 3000,
      };
      
      setLyrics(prev => 
        prev.map(lyric => lyric.id === editingLyric.id ? updatedLyric : lyric)
          .sort((a, b) => a.startTime - b.startTime)
      );
      setCurrentLyricText('');
      setEditingLyric(null);
      setLyricStartTime(null);
    }
  };

  const cancelEdit = () => {
    setEditingLyric(null);
    setCurrentLyricText('');
    setLyricStartTime(null);
  };

  const jumpToLyric = (startTime: number) => {
    seekTo(startTime);
  };

  const jumpBackward = () => {
    const newTime = Math.max(0, currentTime - 100);
    seekTo(newTime);
  };

  const jumpForward = () => {
    const newTime = Math.min(duration, currentTime + 100);
    seekTo(newTime);
  };

  const jumpToPreviousLyric = () => {
    const currentLyric = getCurrentLyric();
    let targetLyric;

    if (currentLyric) {
      // Find the previous lyric
      const currentIndex = lyrics.findIndex(lyric => lyric.id === currentLyric.id);
      targetLyric = lyrics[currentIndex - 1];
    } else {
      // If no current lyric, find the closest previous lyric
      targetLyric = lyrics
        .filter(lyric => lyric.startTime < currentTime)
        .sort((a, b) => b.startTime - a.startTime)[0];
    }

    if (targetLyric) {
      seekTo(targetLyric.startTime);
    }
  };

  const jumpToNextLyric = () => {
    const currentLyric = getCurrentLyric();
    let targetLyric;

    if (currentLyric) {
      // Find the next lyric
      const currentIndex = lyrics.findIndex(lyric => lyric.id === currentLyric.id);
      targetLyric = lyrics[currentIndex + 1];
    } else {
      // If no current lyric, find the closest next lyric
      targetLyric = lyrics
        .filter(lyric => lyric.startTime > currentTime)
        .sort((a, b) => a.startTime - b.startTime)[0];
    }

    if (targetLyric) {
      seekTo(targetLyric.startTime);
    }
  };

  const copyLyricsAsJson = async () => {
    const jsonData = {
      song: {
        title: "Custom Song",
        artist: "Unknown Artist",
        youtubeVideoId: videoId,
      },
      lyrics: lyrics.map(lyric => ({
        id: lyric.id,
        text: lyric.text,
        startTime: lyric.startTime,
        endTime: lyric.endTime,
        startTimeFormatted: formatTimeWithMilliseconds(lyric.startTime),
        endTimeFormatted: formatTimeWithMilliseconds(lyric.endTime),
        duration: lyric.endTime - lyric.startTime,
        durationFormatted: formatTimeWithMilliseconds(lyric.endTime - lyric.startTime),
      })),
      metadata: {
        totalLyrics: lyrics.length,
        duration: duration,
        durationFormatted: formatTimeWithMilliseconds(duration),
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
        title: "Custom Song",
        artist: "Unknown Artist", 
        youtubeVideoId: videoId,
      },
      lyrics: lyrics.map(lyric => ({
        id: lyric.id,
        text: lyric.text,
        startTime: lyric.startTime,
        endTime: lyric.endTime,
        startTimeFormatted: formatTimeWithMilliseconds(lyric.startTime),
        endTimeFormatted: formatTimeWithMilliseconds(lyric.endTime),
        duration: lyric.endTime - lyric.startTime,
        durationFormatted: formatTimeWithMilliseconds(lyric.endTime - lyric.startTime),
      })),
      metadata: {
        totalLyrics: lyrics.length,
        duration: duration,
        durationFormatted: formatTimeWithMilliseconds(duration),
        exportedAt: new Date().toISOString(),
      }
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lyrics_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getJsonData = () => {
    return {
      song: {
        title: "Custom Song",
        artist: "Unknown Artist",
        youtubeVideoId: videoId,
      },
      lyrics: lyrics.map(lyric => ({
        id: lyric.id,
        text: lyric.text,
        startTime: lyric.startTime,
        endTime: lyric.endTime,
        startTimeFormatted: formatTimeWithMilliseconds(lyric.startTime),
        endTimeFormatted: formatTimeWithMilliseconds(lyric.endTime),
        duration: lyric.endTime - lyric.startTime,
        durationFormatted: formatTimeWithMilliseconds(lyric.endTime - lyric.startTime),
      })),
      metadata: {
        totalLyrics: lyrics.length,
        duration: duration,
        durationFormatted: formatTimeWithMilliseconds(duration),
        exportedAt: new Date().toISOString(),
      }
    };
  };

  const loadFromJsonText = (jsonText: string) => {
    try {
      const data = JSON.parse(jsonText);
      
      // Validate JSON structure
      if (!data.song || !data.lyrics || !Array.isArray(data.lyrics)) {
        throw new Error('Invalid JSON structure');
      }

      // Load song data
      if (data.song.youtubeVideoId) {
        setVideoId(data.song.youtubeVideoId);
      }

      // Load lyrics data
      const loadedLyrics: LyricLine[] = data.lyrics.map((lyric: any, index: number) => ({
        id: lyric.id || `loaded-${index}-${Date.now()}`,
        text: lyric.text || '',
        startTime: lyric.startTime || 0,
        endTime: lyric.endTime || lyric.startTime + 3000,
      }));

      setLyrics(loadedLyrics.sort((a, b) => a.startTime - b.startTime));
      setShowJsonLoader(false);
      
      // Clear any editing states
      setEditingLyric(null);
      setCurrentLyricText('');
      setLyricStartTime(null);

      return { success: true, message: `Loaded ${loadedLyrics.length} lyrics successfully!` };
    } catch (error) {
      console.error('JSON loading error:', error);
      return { success: false, message: 'Invalid JSON format. Please check your JSON structure.' };
    }
  };

  const loadFromJsonFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const jsonText = e.target?.result as string;
      const result = loadFromJsonText(jsonText);
      
      if (result.success) {
        alert(result.message);
      } else {
        alert(result.message);
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only enable shortcuts when not typing in input fields
      if (event.target instanceof HTMLInputElement) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          jumpBackward();
          break;
        case 'ArrowRight':
          event.preventDefault();
          jumpForward();
          break;
        case ' ':
          event.preventDefault();
          togglePlayPause();
          break;
        case 'Enter':
          if (currentLyricText.trim()) {
            event.preventDefault();
            if (editingLyric) {
              updateLyric();
            } else {
              addLyric();
            }
          }
          break;
        case 's':
        case 'S':
          if (isEditorMode) {
            event.preventDefault();
            markStartTime();
          }
          break;
        case 'Escape':
          if (editingLyric) {
            event.preventDefault();
            cancelEdit();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, currentLyricText, isEditorMode, editingLyric]);

  const getCurrentLyric = () => {
    return lyrics.find(lyric => 
      currentTime >= lyric.startTime && currentTime <= lyric.endTime
    );
  };

  const currentLyric = getCurrentLyric();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Simple Chant Mix Tracker
          </h1>
        </header>

        {/* Video Input */}
        <div className="mb-6 bg-gray-800 rounded-lg p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder="Enter YouTube video ID or URL"
              className="flex-1 p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={handleVideoLoad}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Load
            </button>
          </div>
        </div>

        {/* Main Layout - Video Left, Lyrics Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left: Video Player */}
          <div className="bg-gray-800 rounded-lg p-4">
            {videoId ? (
              <YouTubePlayerComponent
                videoId={videoId}
                onReady={handlePlayerReady}
                onStateChange={handleStateChange}
                onTimeUpdate={handleTimeUpdate}
                width="100%"
                height="250"
              />
            ) : (
              <div className="bg-gray-700 rounded-lg p-8 text-center aspect-video flex items-center justify-center">
                <div>
                  <div className="text-4xl mb-2">🎵</div>
                  <p className="text-gray-400">Load a video to start</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Lyrics Display */}
          <div className="bg-gray-800 rounded-lg p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Lyrics ({lyrics.length})</h3>
              <div className="flex items-center space-x-2">
                {isEditorMode && (
                  <div className="flex items-center space-x-1 mr-2">
                    <button
                      onClick={jumpBackward}
                      disabled={!videoId}
                      className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                      title="Jump back 100ms (←)"
                    >
                      ⏪ -100ms
                    </button>
                    <button
                      onClick={jumpForward}
                      disabled={!videoId}
                      className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                      title="Jump forward 100ms (→)"
                    >
                      ⏩ +100ms
                    </button>
                    <button
                      onClick={() => setShowJsonModal(true)}
                      disabled={lyrics.length === 0}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-2 py-1 rounded text-xs font-medium transition-colors ml-1"
                      title="View JSON data"
                    >
                      📄 JSON
                    </button>
                    <button
                      onClick={() => setShowJsonLoader(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors ml-1"
                      title="Load JSON data"
                    >
                      📁 Load
                    </button>
                    <button
                      onClick={markStartTime}
                      disabled={!videoId}
                      className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-2 py-1 rounded text-xs font-medium transition-colors ml-1"
                      title="Mark start time (S)"
                    >
                      📍 Start
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setIsEditorMode(!isEditorMode)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    isEditorMode 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isEditorMode ? '👁️ View Mode' : '✏️ Edit Mode'}
                </button>
              </div>
            </div>

            {isEditorMode && videoId && (
              <div className="mb-3 p-2 bg-gray-700 rounded text-xs text-gray-300 flex-shrink-0">
                <div className="font-medium mb-1">⌨️ Keyboard Shortcuts:</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span>← Previous 100ms</span>
                  <span>→ Next 100ms</span>
                  <span>Space Play/Pause</span>
                  <span>S Mark Start Time</span>
                  <span>Enter Add/Update Lyric</span>
                  <span>Esc Cancel Edit</span>
                </div>
                {lyricStartTime !== null && (
                  <div className="mt-2 p-2 bg-orange-900/30 border border-orange-500/30 rounded text-xs">
                    <span className="text-orange-300">
                      📍 Start marked at: {formatTimeWithMilliseconds(lyricStartTime)} 
                      <span className="text-gray-400 ml-2">
                        (End will be set when adding lyric)
                      </span>
                    </span>
                  </div>
                )}
                {editingLyric && (
                  <div className="mt-2 p-2 bg-blue-900/30 border border-blue-500/30 rounded text-xs">
                    <span className="text-blue-300">
                      ✏️ Editing: "{editingLyric.text}" 
                      <span className="text-gray-400 ml-2">
                        (Press Enter to update, Esc to cancel)
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
              {lyrics.length > 0 ? (
                isEditorMode ? (
                  // Editor Mode - Card-based with backgrounds
                  <div className="space-y-2">
                    {lyrics.map((lyric) => (
                      <div
                        key={lyric.id}
                        className={`p-3 rounded-lg transition-all duration-200 ${
                          editingLyric?.id === lyric.id
                            ? 'bg-blue-700 border-2 border-blue-500 text-white'
                            : currentLyric?.id === lyric.id
                            ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span 
                            className="flex-1 cursor-pointer"
                            onClick={() => jumpToLyric(lyric.startTime)}
                          >
                            {lyric.text}
                          </span>
                          <div className="flex items-center space-x-2 ml-2">
                            <div className="text-xs opacity-75 text-right">
                              <div>{formatTimeWithMilliseconds(lyric.startTime)} - {formatTimeWithMilliseconds(lyric.endTime)}</div>
                              <div className="text-gray-500">
                                Duration: {formatTimeWithMilliseconds(lyric.endTime - lyric.startTime)}
                              </div>
                            </div>
                            <button
                              onClick={() => editLyric(lyric)}
                              className="text-yellow-400 hover:text-yellow-300 text-sm"
                              title="Edit lyric"
                            >
                              ✏️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // View Mode - Floating text without cards
                  <div className="space-y-4 text-center">
                    {lyrics.map((lyric) => (
                      <div
                        key={lyric.id}
                        onClick={() => jumpToLyric(lyric.startTime)}
                        className={`cursor-pointer transition-all duration-300 ${
                          currentLyric?.id === lyric.id
                            ? 'text-2xl font-bold text-white drop-shadow-lg transform scale-110'
                            : 'text-lg text-gray-400 hover:text-gray-300'
                        }`}
                        style={{
                          textShadow: currentLyric?.id === lyric.id 
                            ? '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(59, 130, 246, 0.5)' 
                            : '1px 1px 2px rgba(0,0,0,0.5)'
                        }}
                      >
                        {lyric.text}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-3xl mb-2">📝</div>
                  <p>No lyrics yet. Add some below!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex flex-col space-y-4">
            {/* Progress Bar */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-mono">{formatTimeWithMilliseconds(currentTime)}</span>
              <div className="flex-1 bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                  style={{
                    width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                  }}
                />
              </div>
              <span className="text-sm">{formatTimeWithMilliseconds(duration)}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {isEditorMode ? (
                <>
                  {/* Editor Mode Controls */}
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlayPause}
                    disabled={!isReady || !videoId}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors"
                  >
                    {playerState === YT_PLAYER_STATE.PLAYING ? '⏸️' : '▶️'}
                  </button>

                  {/* Add Lyric Input */}
                  <input
                    type="text"
                    value={currentLyricText}
                    onChange={(e) => setCurrentLyricText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (editingLyric) {
                          updateLyric();
                        } else {
                          addLyric();
                        }
                      }
                    }}
                    placeholder={editingLyric ? "Edit lyric text..." : "Type lyric text and press Add..."}
                    className={`flex-1 p-2 rounded-lg focus:ring-2 focus:outline-none ${
                      editingLyric 
                        ? 'bg-blue-800 text-white focus:ring-blue-500 border-2 border-blue-500' 
                        : 'bg-gray-700 text-white focus:ring-blue-500'
                    }`}
                  />

                  {/* Add/Update Button */}
                  {editingLyric ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={updateLyric}
                        disabled={!currentLyricText.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors font-medium"
                      >
                        Update
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={addLyric}
                      disabled={!currentLyricText.trim() || !videoId}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      Add
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* View Mode Controls */}
                  <div className="flex items-center justify-center space-x-6 flex-1">
                    {/* Previous Lyric */}
                    <button
                      onClick={jumpToPreviousLyric}
                      disabled={!videoId || lyrics.length === 0}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2"
                      title="Jump to previous lyric"
                    >
                      <span>⏮️</span>
                      <span>Previous</span>
                    </button>

                    {/* Play/Pause */}
                    <button
                      onClick={togglePlayPause}
                      disabled={!isReady || !videoId}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors text-xl"
                    >
                      {playerState === YT_PLAYER_STATE.PLAYING ? '⏸️' : '▶️'}
                    </button>

                    {/* Next Lyric */}
                    <button
                      onClick={jumpToNextLyric}
                      disabled={!videoId || lyrics.length === 0}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2"
                      title="Jump to next lyric"
                    >
                      <span>Next</span>
                      <span>⏭️</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* JSON Modal */}
        {showJsonModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold">📄 Lyrics JSON Data</h2>
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="p-4">
                {/* Export Controls */}
                <div className="flex justify-between items-center mb-4 p-3 bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-300">Export your lyrics data</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={copyLyricsAsJson}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      📋 Copy JSON
                    </button>
                    <button
                      onClick={downloadLyricsAsJson}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      💾 Download
                    </button>
                  </div>
                </div>

                {/* JSON Viewer */}
                <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto">
                  <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(getJsonData(), null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JSON Loader Modal */}
        {showJsonLoader && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold">📁 Load JSON Data</h2>
                <button
                  onClick={() => setShowJsonLoader(false)}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="p-4">
                {/* File Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Load from JSON file:</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={loadFromJsonFile}
                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
                  />
                  <p className="text-xs text-gray-400 mt-1">Select a JSON file exported from this app</p>
                </div>

                {/* Text Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Or paste JSON text:</label>
                  <textarea
                    id="json-input"
                    rows={12}
                    className="w-full p-3 bg-gray-900 text-green-400 font-mono text-xs rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    placeholder="Paste your JSON data here..."
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-400">Paste the JSON data exported from this app</p>
                    <button
                      onClick={() => {
                        const textarea = document.getElementById('json-input') as HTMLTextAreaElement;
                        if (textarea && textarea.value.trim()) {
                          const result = loadFromJsonText(textarea.value);
                          if (result.success) {
                            alert(result.message);
                            textarea.value = '';
                          } else {
                            alert(result.message);
                          }
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      📁 Load JSON
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-xs">
                  <div className="font-medium text-blue-300 mb-1">ℹ️ Loading JSON will:</div>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li>Replace all current lyrics</li>
                    <li>Load the YouTube video ID (if present)</li>
                    <li>Sort lyrics by start time</li>
                    <li>Clear any current editing states</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/new")({
  component: NewPage,
})

export default NewPage;