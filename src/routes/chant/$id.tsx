import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import YouTubePlayerComponent from '@/components/YouTubePlayer'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import type { LyricLine } from '@/types'
import { YT_PLAYER_STATE } from '@/types'
import { getAssetPath } from '@/utils/basePath'

export const Route = createFileRoute('/chant/$id')({
  component: ChantPlayer,
})

interface ChantData {
  song: {
    title: string
    artist: string
    youtubeVideoId: string
  }
  lyrics: LyricLine[]
  metadata: {
    totalLyrics: number
    duration: number
    durationFormatted: string
    exportedAt: string
    contributor: string
    description: string
    tags: string[]
  }
}

function ChantPlayer() {
  const { id } = Route.useParams()
  const [chantData, setChantData] = useState<ChantData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1)

  const {
    playerState,
    currentTime,
    isReady,
    handlePlayerReady,
    handleStateChange,
    handleTimeUpdate,
    seekTo,
    togglePlayPause,
  } = useYouTubePlayer()

  const isPlaying = playerState === YT_PLAYER_STATE.PLAYING

  useEffect(() => {
    const fetchChantData = async () => {
      try {
        const response = await fetch(getAssetPath(`/data/chants/${id}.json`))
        if (!response.ok) {
          throw new Error('Chant not found')
        }
        const data: ChantData = await response.json()
        setChantData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chant')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchChantData()
    }
  }, [id])

  // Update current lyric index based on current time
  useEffect(() => {
    if (!chantData?.lyrics) return

    const current = chantData.lyrics.findIndex(
      (lyric) => currentTime >= lyric.startTime && currentTime <= lyric.endTime
    )
    setCurrentLyricIndex(current)
  }, [currentTime, chantData?.lyrics])

  // Auto-scroll to current lyric with better centering
  useEffect(() => {
    if (currentLyricIndex >= 0 && chantData?.lyrics) {
      const currentLyric = chantData.lyrics[currentLyricIndex]
      const element = document.getElementById(`lyric-${currentLyric.id}`)
      if (element) {
        // Use a small delay to ensure DOM is updated
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          })
        }, 100)
      }
    }
  }, [currentLyricIndex, chantData?.lyrics])

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const milliseconds = ms % 1000
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
  }

  const jumpToPreviousLyric = () => {
    if (!chantData?.lyrics || chantData.lyrics.length === 0) return
    
    if (currentLyricIndex <= 0) {
      // Jump to first lyric
      seekTo(chantData.lyrics[0].startTime)
    } else {
      // Jump to previous lyric
      seekTo(chantData.lyrics[currentLyricIndex - 1].startTime)
    }
  }

  const jumpToNextLyric = () => {
    if (!chantData?.lyrics || chantData.lyrics.length === 0) return
    
    if (currentLyricIndex >= chantData.lyrics.length - 1) {
      // Jump to last lyric
      seekTo(chantData.lyrics[chantData.lyrics.length - 1].startTime)
    } else {
      // Jump to next lyric
      const nextIndex = currentLyricIndex < 0 ? 0 : currentLyricIndex + 1
      seekTo(chantData.lyrics[nextIndex].startTime)
    }
  }

  const jumpToLyric = (lyric: LyricLine) => {
    seekTo(lyric.startTime)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chant...</p>
        </div>
      </div>
    )
  }

  if (error || !chantData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">🎵</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Chant Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error === 'Chant not found' 
              ? `The chant with ID "${id}" doesn't exist yet.`
              : error
            }
          </p>
          
          <div className="space-y-3">
            {error === 'Chant not found' && (
              <Link
                to="/new/$id"
                params={{ id }}
                className="block bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded transition-colors"
              >
                Create Chant "{id}"
              </Link>
            )}
            
            <Link
              to="/"
              className="block bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition-colors"
            >
              Back to Home
            </Link>
            
            <Link
              to="/new"
              className="block bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded transition-colors"
            >
              Create New Chant
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-blue-500 hover:text-blue-700 font-medium flex items-center gap-2"
              >
                ← Back to Home
              </Link>
              <div className="border-l h-6"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{chantData.song.title}</h1>
                <p className="text-gray-600">by {chantData.song.artist}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/new"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Create New
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Video Player */}
          <div className="space-y-6">
            {/* Video Player */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <YouTubePlayerComponent
                  videoId={chantData.song.youtubeVideoId}
                  onReady={handlePlayerReady}
                  onStateChange={handleStateChange}
                  onTimeUpdate={handleTimeUpdate}
                  width="100%"
                  height="315"
                />
              </div>
              
              {/* Player Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={jumpToPreviousLyric}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
                    disabled={!chantData.lyrics || chantData.lyrics.length === 0}
                  >
                    ⏮️ Previous
                  </button>
                  <button
                    onClick={togglePlayPause}
                    disabled={!isReady}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition-colors disabled:opacity-50"
                  >
                    {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                  </button>
                  <button
                    onClick={jumpToNextLyric}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
                    disabled={!chantData.lyrics || chantData.lyrics.length === 0}
                  >
                    ⏭️ Next
                  </button>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Current Time: <span className="font-mono">{formatTime(currentTime)}</span>
                  </p>
                  {currentLyricIndex >= 0 && chantData.lyrics[currentLyricIndex] && (
                    <p className="text-sm text-blue-600 mt-1">
                      Now: "{chantData.lyrics[currentLyricIndex].text}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Chant Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Chant Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Contributor:</span>
                  <span className="ml-2 text-gray-600">{chantData.metadata.contributor}</span>
                </div>
                {chantData.metadata.description && (
                  <div>
                    <span className="font-medium text-gray-700">Description:</span>
                    <p className="text-gray-600 mt-1">{chantData.metadata.description}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Total Lyrics:</span>
                  <span className="ml-2 text-gray-600">{chantData.metadata.totalLyrics}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Duration:</span>
                  <span className="ml-2 text-gray-600">{chantData.metadata.durationFormatted}</span>
                </div>
                {chantData.metadata.tags && chantData.metadata.tags.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {chantData.metadata.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Lyrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-6 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Lyrics ({chantData.lyrics.length})</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Click on any lyric to jump to that moment
              </p>
            </div>
            
            <div className="p-6 h-[600px] overflow-y-auto scrollbar-hide lyrics-container" style={{ scrollBehavior: 'smooth' }}>
              {chantData.lyrics.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No lyrics available for this chant.</p>
              ) : (
                <div className="space-y-3 py-48"> {/* Add padding to allow centering of first/last items */}
                  {chantData.lyrics.map((lyric, index) => {
                    const isActive = index === currentLyricIndex
                    
                    return (
                      <div
                        key={lyric.id}
                        id={`lyric-${lyric.id}`}
                        onClick={() => jumpToLyric(lyric)}
                        className={`p-4 rounded-lg cursor-pointer transition-all duration-300 lyric-line ${
                          isActive 
                            ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-400 shadow-lg transform scale-105 text-blue-900 dark:text-blue-100' 
                            : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <p className={`flex-1 ${isActive ? 'font-semibold' : ''}`}>
                            {lyric.text}
                          </p>
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                            <div>{formatTime(lyric.startTime)}</div>
                            <div>→ {formatTime(lyric.endTime)}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
