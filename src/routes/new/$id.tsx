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
  const [isEditorMode, setIsEditorMode] = useState(true);
  const [lyricStartTime, setLyricStartTime] = useState<number | null>(null);
  const [editingLyric, setEditingLyric] = useState<LyricLine | null>(null);
  const [showJsonLoader, setShowJsonLoader] = useState(false);

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

  useEffect(() => {
    if (id && id !== videoId) {
      setVideoId(id)
    }
  }, [id, videoId])

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
      title: `Chant Mix - ${videoId}`,
      contributor: "Unknown",
      tags: ["chant", "mix"],
      description: `YouTube chant mix for video ${videoId}`,
      videoId,
      lyrics: lyrics.map(lyric => ({
        id: lyric.id,
        text: lyric.text,
        startTime: lyric.startTime,
        endTime: lyric.endTime
      }))
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
          if (data.videoId) {
            setVideoId(data.videoId)
          }
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
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
                Create Chant: {id}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => setIsEditorMode(!isEditorMode)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                {isEditorMode ? 'Preview Mode' : 'Editor Mode'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Video Input */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
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
          
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            <span>Current Time: {formatTime(currentTime)}</span>
            <span>Duration: {formatTime(duration)}</span>
            <button
              onClick={togglePlayPause}
              className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>
        </div>

        {isEditorMode ? (
          /* Editor Mode */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lyric Input */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                {editingLyric ? 'Edit Lyric' : 'Add Lyric'}
              </h2>
              
              <div className="mb-4">
                <textarea
                  placeholder="Enter lyric text..."
                  value={currentLyricText}
                  onChange={(e) => setCurrentLyricText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-24 resize-none"
                />
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">Start Time:</span>
                <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-white">
                  {lyricStartTime !== null ? formatTime(lyricStartTime) : formatTime(currentTime)}
                </span>
                <button
                  onClick={captureCurrentTime}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Capture Current Time
                </button>
              </div>
              
              <div className="flex gap-2">
                {editingLyric ? (
                  <>
                    <button
                      onClick={saveEditedLyric}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={addLyric}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Add Lyric
                  </button>
                )}
              </div>
            </div>

            {/* Lyrics List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Lyrics ({lyrics.length})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowJsonLoader(true)}
                    className="bg-purple-500 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Load JSON
                  </button>
                  <button
                    onClick={exportToJson}
                    className="bg-green-500 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Export JSON
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {lyrics.map((lyric) => (
                  <div
                    key={lyric.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-800 dark:text-white font-medium">{lyric.text}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTime(lyric.startTime)} - {formatTime(lyric.endTime)}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => seekTo(lyric.startTime)}
                          className="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                        >
                          Jump
                        </button>
                        <button
                          onClick={() => editLyric(lyric)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteLyric(lyric.id)}
                          className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {lyrics.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No lyrics added yet. Start by adding some lyrics above!
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Preview</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {lyrics.map((lyric) => {
                const isActive = currentTime >= lyric.startTime && currentTime <= lyric.endTime
                return (
                  <div
                    key={lyric.id}
                    className={`p-3 rounded-lg transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500 text-blue-900 dark:text-blue-100' 
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => seekTo(lyric.startTime)}
                  >
                    <p className="font-medium">{lyric.text}</p>
                    <p className="text-xs opacity-75">
                      {formatTime(lyric.startTime)} - {formatTime(lyric.endTime)}
                    </p>
                  </div>
                )
              })}
              {lyrics.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No lyrics to preview. Switch to Editor Mode to add lyrics.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

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
    </div>
  )
}
