import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from 'react';
import YouTubePlayerComponent from '@/components/YouTubePlayer';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import type { LyricLine } from '@/types';
import { YT_PLAYER_STATE } from '@/types';
import ThemeToggle from '@/components/ThemeToggle';

export const Route = createFileRoute('/new/$id')({
  component: NewChantWithId,
})

function NewChantWithId() {
  const { id } = Route.useParams()
  const router = useRouter()
  const [videoId, setVideoId] = useState(id || '');
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyricText, setCurrentLyricText] = useState('');
  const [lyricStartTime, setLyricStartTime] = useState<number | null>(null);
  const [editingLyric, setEditingLyric] = useState<LyricLine | null>(null);
  const [showJsonLoader, setShowJsonLoader] = useState(false);
  const [existingChantData, setExistingChantData] = useState<any>(null);
  const [chantTitle, setChantTitle] = useState('');
  const [chantDescription, setChantDescription] = useState('');
  const [chantContributor, setChantContributor] = useState('');
  const [chantTags, setChantTags] = useState<string[]>([]);
  const [showChantInfoModal, setShowChantInfoModal] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);

  const {
    playerState,
    currentTime,
    duration,
    seekTo,
    togglePlayPause,
    handlePlayerReady,
    handleStateChange,
    handleTimeUpdate,
  } = useYouTubePlayer()

  const isPlaying = playerState === YT_PLAYER_STATE.PLAYING

  // Load existing chant data if ID exists
  useEffect(() => {
    const loadExistingChant = async () => {
      if (!id) return;
      
      // Try different possible paths
      const possiblePaths = [
        `/data/chants/${id}.json`,
        `./data/chants/${id}.json`,
        `/chantmix_tracker/data/chants/${id}.json`
      ];
      
      for (const path of possiblePaths) {
        console.log('Attempting to fetch chant data from:', path);
        
        try {
          const response = await fetch(path);
          console.log(`Fetch response from ${path}:`, response.status);
          
          if (response.ok) {
            const chantData = await response.json();
            console.log('Loaded chant data:', chantData);
            setExistingChantData(chantData);
            
            // Load the data into the editor
            if (chantData.song?.youtubeVideoId) {
              setVideoId(chantData.song.youtubeVideoId);
            }
            if (chantData.lyrics) {
              setLyrics(chantData.lyrics);
            }
            if (chantData.song?.title) {
              setChantTitle(chantData.song.title);
            }
            if (chantData.metadata?.description) {
              setChantDescription(chantData.metadata.description);
            }
            if (chantData.metadata?.contributor) {
              setChantContributor(chantData.metadata.contributor);
            }
            if (chantData.metadata?.tags) {
              setChantTags(chantData.metadata.tags);
            }
            return; // Success, exit the loop
          }
        } catch (error) {
          console.log(`Error loading from ${path}:`, error);
        }
      }
      
      console.log('No existing chant found at any path, creating new one');
    };

    loadExistingChant();
  }, [id]);

  useEffect(() => {
    if (id && id !== videoId && !existingChantData) {
      setVideoId(id)
    }
  }, [id, videoId, existingChantData])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Only activate shortcuts when not typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Prevent default behavior for our shortcuts
      const shortcuts = ['q', 'w', 'a', 's', 'z', 'x', ' '];
      if (shortcuts.includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      switch (e.key.toLowerCase()) {
        case 'q': // Mark start time
          setLyricStartTime(currentTime);
          break;
        case 'w': // Mark end time (add lyric)
          if (currentLyricText.trim()) {
            addLyric();
          }
          break;
        case 'a': // Seek backward 100ms
          seekTo(Math.max(0, currentTime - 100));
          break;
        case 's': // Seek forward 100ms
          seekTo(currentTime + 100);
          break;
        case 'z': // Seek to previous lyric
          seekToPreviousLyric();
          break;
        case 'x': // Seek to next lyric
          seekToNextLyric();
          break;
        case ' ': // Toggle play/pause
          togglePlayPause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [currentTime, currentLyricText, lyrics]);

  // Track current lyric position
  useEffect(() => {
    if (lyrics.length === 0) {
      setCurrentLyricIndex(-1);
      return;
    }

    const sortedLyrics = [...lyrics].sort((a, b) => a.startTime - b.startTime);
    let newIndex = -1;

    for (let i = 0; i < sortedLyrics.length; i++) {
      const lyric = sortedLyrics[i];
      if (currentTime >= lyric.startTime && currentTime <= lyric.endTime) {
        newIndex = i;
        break;
      }
    }

    if (newIndex !== currentLyricIndex) {
      setCurrentLyricIndex(newIndex);
      
      // Auto-scroll to current lyric with delay
      if (newIndex >= 0) {
        setTimeout(() => {
          const lyricElement = document.getElementById(`lyric-${sortedLyrics[newIndex].id}`);
          if (lyricElement) {
            lyricElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }, 100);
      }
    }
  }, [currentTime, lyrics, currentLyricIndex]);

  const seekToPreviousLyric = () => {
    const sortedLyrics = [...lyrics].sort((a, b) => a.startTime - b.startTime);
    const currentIndex = sortedLyrics.findIndex(lyric => lyric.startTime > currentTime);
    const previousIndex = currentIndex - 1;
    
    if (previousIndex >= 0) {
      seekTo(sortedLyrics[previousIndex].startTime);
    } else if (sortedLyrics.length > 0) {
      seekTo(sortedLyrics[sortedLyrics.length - 1].startTime);
    }
  };

  const seekToNextLyric = () => {
    const sortedLyrics = [...lyrics].sort((a, b) => a.startTime - b.startTime);
    const nextLyric = sortedLyrics.find(lyric => lyric.startTime > currentTime);
    
    if (nextLyric) {
      seekTo(nextLyric.startTime);
    } else if (sortedLyrics.length > 0) {
      seekTo(sortedLyrics[0].startTime);
    }
  };

  const addLyric = () => {
    if (!currentLyricText.trim()) return
    
    const startTime = lyricStartTime !== null ? lyricStartTime : currentTime
    const newLyric: LyricLine = {
      id: Date.now().toString(),
      text: currentLyricText.trim(),
      startTime,
      endTime: startTime + 3000 // Default 3 seconds duration
    }
    
    setLyrics(prev => [...prev, newLyric].sort((a, b) => a.startTime - b.startTime))
    setCurrentLyricText('')
    setLyricStartTime(null)
  }

  const deleteLyric = (lyricId: string) => {
    setLyrics(prev => prev.filter(l => l.id !== lyricId))
  }

  const editLyric = (lyric: LyricLine) => {
    setEditingLyric(lyric)
    setCurrentLyricText(lyric.text)
    setLyricStartTime(lyric.startTime)
  }

  const saveEditedLyric = () => {
    if (!editingLyric || !currentLyricText.trim()) return
    
    const startTime = lyricStartTime !== null ? lyricStartTime : currentTime
    const updatedLyric: LyricLine = {
      ...editingLyric,
      text: currentLyricText.trim(),
      startTime,
      endTime: startTime + 3000
    }
    
    setLyrics(prev => prev.map(l => l.id === editingLyric.id ? updatedLyric : l).sort((a, b) => a.startTime - b.startTime))
    setEditingLyric(null)
    setCurrentLyricText('')
    setLyricStartTime(null)
  }

  const cancelEdit = () => {
    setEditingLyric(null)
    setCurrentLyricText('')
    setLyricStartTime(null)
  }

  const captureCurrentTime = () => {
    setLyricStartTime(currentTime)
  }

  const exportToJson = () => {
    const exportData = {
      id: videoId,
      song: {
        title: chantTitle || `Chant Mix - ${videoId}`,
        artist: "Unknown Artist",
        youtubeVideoId: videoId
      },
      lyrics: lyrics.map(lyric => ({
        id: lyric.id,
        text: lyric.text,
        startTime: lyric.startTime,
        endTime: lyric.endTime,
        startTimeFormatted: formatTime(lyric.startTime),
        endTimeFormatted: formatTime(lyric.endTime),
        duration: lyric.endTime - lyric.startTime,
        durationFormatted: formatTime(lyric.endTime - lyric.startTime)
      })),
      metadata: {
        totalLyrics: lyrics.length,
        duration: duration,
        durationFormatted: formatTime(duration),
        exportedAt: new Date().toISOString(),
        contributor: chantContributor || "Unknown",
        description: chantDescription || `YouTube chant mix for video ${videoId}`,
        tags: chantTags.length > 0 ? chantTags : ["chant", "mix"]
      }
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${videoId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const loadFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.lyrics && Array.isArray(data.lyrics)) {
          setLyrics(data.lyrics)
          
          // Load video ID
          if (data.song?.youtubeVideoId) {
            setVideoId(data.song.youtubeVideoId)
          } else if (data.videoId) {
            setVideoId(data.videoId)
          }
          
          // Load metadata
          if (data.song?.title) {
            setChantTitle(data.song.title)
          } else if (data.title) {
            setChantTitle(data.title)
          }
          
          if (data.metadata?.description) {
            setChantDescription(data.metadata.description)
          } else if (data.description) {
            setChantDescription(data.description)
          }
          
          if (data.metadata?.contributor) {
            setChantContributor(data.metadata.contributor)
          } else if (data.contributor) {
            setChantContributor(data.contributor)
          }
          
          if (data.metadata?.tags) {
            setChantTags(data.metadata.tags)
          } else if (data.tags) {
            setChantTags(data.tags)
          }
          
          setExistingChantData(data)
        }
      } catch (error) {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    setShowJsonLoader(false)
  }

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const milliseconds = ms % 1000
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-56">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.history.back()}
                className="text-blue-500 hover:text-blue-700 transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {existingChantData ? `Edit Chant: ${chantTitle || id}` : `Create Chant: ${id}`}
              </h1>
              {existingChantData && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Editing existing chant • {lyrics.length} lyrics
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {existingChantData && (
                <button
                  onClick={() => setShowChantInfoModal(true)}
                  className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  📝 Chant Info
                </button>
              )}
              <button
                onClick={exportToJson}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                💾 Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video Player & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Video Player */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">YouTube Video</h2>
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="YouTube Video ID"
                  value={videoId}
                  onChange={(e) => setVideoId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => {/* Video will reload automatically when videoId changes */}}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Load Video
                </button>
              </div>
              
              {videoId && (
                <div className="mb-4">
                  <YouTubePlayerComponent 
                    videoId={videoId}
                    onReady={handlePlayerReady}
                    onStateChange={handleStateChange}
                    onTimeUpdate={handleTimeUpdate}
                  />
                </div>
              )}
              
              {/* Player Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => seekTo(Math.max(0, currentTime - 100))}
                    className="bg-gray-500 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-800 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    ⏮️ -100ms (A)
                  </button>
                  <button
                    onClick={togglePlayPause}
                    className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 text-white font-bold py-3 px-6 rounded transition-colors"
                  >
                    {isPlaying ? '⏸️ Pause' : '▶️ Play'} (Space)
                  </button>
                  <button
                    onClick={() => seekTo(currentTime + 100)}
                    className="bg-gray-500 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-800 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    ⏭️ +100ms (S)
                  </button>
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={seekToPreviousLyric}
                    className="bg-purple-500 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-800 text-white font-bold py-2 px-4 rounded transition-colors"
                    disabled={!lyrics || lyrics.length === 0}
                  >
                    ⏮️ Previous Lyric (Z)
                  </button>
                  <button
                    onClick={seekToNextLyric}
                    className="bg-purple-500 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-800 text-white font-bold py-2 px-4 rounded transition-colors"
                    disabled={!lyrics || lyrics.length === 0}
                  >
                    ⏭️ Next Lyric (X)
                  </button>
                </div>
                
                {currentLyricIndex >= 0 && lyrics.length > 0 && (
                  <div className="text-center p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                      Now Playing: "{lyrics.sort((a, b) => a.startTime - b.startTime)[currentLyricIndex]?.text}"
                    </p>
                  </div>
                )}
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Current Time: <span className="font-mono">{formatTime(currentTime)}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Duration: <span className="font-mono">{formatTime(duration)}</span>
                  </p>
                </div>
              </div>
              
              {/* Keyboard Shortcuts */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Keyboard Shortcuts</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div><kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded">Q</kbd> Mark Start</div>
                  <div><kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded">W</kbd> Add Lyric</div>
                  <div><kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded">A</kbd> -100ms</div>
                  <div><kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded">S</kbd> +100ms</div>
                  <div><kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded">Z</kbd> Prev Lyric</div>
                  <div><kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded">X</kbd> Next Lyric</div>
                  <div className="col-span-2"><kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded">Space</kbd> Play/Pause</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Lyrics List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="p-6 border-b dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Lyrics ({lyrics.length})</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Click on any lyric to jump to that moment
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowJsonLoader(true)}
                      className="bg-purple-500 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      📁 Load JSON
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 h-[600px] overflow-y-auto scrollbar-hide">
                {lyrics.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No lyrics added yet. Start by adding some lyrics!</p>
                ) : (
                  <div className="space-y-3">
                    {lyrics.sort((a, b) => a.startTime - b.startTime).map((lyric, index) => {
                      const isCurrentLyric = currentLyricIndex === index;
                      return (
                        <div
                          key={lyric.id}
                          id={`lyric-${lyric.id}`}
                          className={`border rounded-lg p-4 transition-all duration-300 cursor-pointer ${
                            isCurrentLyric
                              ? 'border-blue-500 bg-blue-100 dark:bg-blue-900 border-l-4 border-l-blue-500'
                              : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          onClick={() => seekTo(lyric.startTime)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`font-medium ${
                                isCurrentLyric 
                                  ? 'text-blue-900 dark:text-blue-100' 
                                  : 'text-gray-800 dark:text-white'
                              }`}>
                                {lyric.text}
                              </p>
                              <p className={`text-sm ${
                                isCurrentLyric 
                                  ? 'text-blue-700 dark:text-blue-300' 
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {formatTime(lyric.startTime)} - {formatTime(lyric.endTime)}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  seekTo(lyric.startTime);
                                }}
                                className="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                              >
                                Jump
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  editLyric(lyric);
                                }}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteLyric(lyric.id);
                                }}
                                className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chant Information Modal */}
      {showChantInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Chant Information</h3>
              <button
                onClick={() => setShowChantInfoModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={chantTitle}
                  onChange={(e) => setChantTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter chant title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contributor
                </label>
                <input
                  type="text"
                  value={chantContributor}
                  onChange={(e) => setChantContributor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter contributor name"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={chantDescription}
                  onChange={(e) => setChantDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-20 resize-none"
                  placeholder="Enter chant description"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={chantTags.join(', ')}
                  onChange={(e) => setChantTags(e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>
            
            {existingChantData && existingChantData.metadata && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Original Data</h4>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Total Lyrics: {existingChantData.metadata.totalLyrics}</p>
                  <p>Duration: {existingChantData.metadata.durationFormatted}</p>
                  {existingChantData.metadata.exportedAt && (
                    <p>Last Modified: {new Date(existingChantData.metadata.exportedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowChantInfoModal(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Loader Modal */}
      {showJsonLoader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Load Lyrics from JSON</h3>
            <input
              type="file"
              accept=".json"
              onChange={loadFromJson}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowJsonLoader(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Lyric Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 shadow-lg z-40">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editingLyric ? 'Edit Lyric' : 'Add Lyric'}
              </h3>
              {editingLyric && (
                <button
                  onClick={cancelEdit}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                >
                  ✕ Cancel (Esc)
                </button>
              )}
            </div>
            
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <textarea
                  placeholder="Enter lyric text..."
                  value={currentLyricText}
                  onChange={(e) => setCurrentLyricText(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-12 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (currentLyricText.trim()) {
                        if (editingLyric) {
                          saveEditedLyric();
                        } else {
                          addLyric();
                        }
                      }
                    }
                  }}
                />
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-300">Start:</span>
                <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-white text-xs">
                  {formatTime(lyricStartTime ?? currentTime)}
                </span>
                <button
                  onClick={captureCurrentTime}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm transition-colors whitespace-nowrap"
                >
                  Mark (S)
                </button>
              </div>
              
              <div className="flex gap-2">
                {editingLyric ? (
                  <button
                    onClick={saveEditedLyric}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={addLyric}
                    disabled={!currentLyricText.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
            
            {/* Keyboard shortcuts hint */}
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <span>💡 Press Enter to add/update, S to mark start time, Esc to cancel</span>
              <span className="text-gray-400 dark:text-gray-500">
                {lyrics.length} lyrics • {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
