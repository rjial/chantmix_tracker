import React from 'react';
import type { LyricLine } from '../types';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number; // in milliseconds
  onLyricClick?: (startTime: number) => void;
  onSetLoop?: (lyric: LyricLine) => void;
  onToggleSelection?: (lyricId: string) => void;
  loopStart?: number | null;
  loopEnd?: number | null;
  isLooping?: boolean;
  selectedLyrics?: string[];
  isMultiSelectMode?: boolean;
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  lyrics,
  currentTime,
  onLyricClick,
  onSetLoop,
  onToggleSelection,
  loopStart,
  loopEnd,
  isLooping,
  selectedLyrics = [],
  isMultiSelectMode = false,
}) => {
  const getCurrentLyricIndex = () => {
    return lyrics.findIndex(
      (line) => currentTime >= line.startTime && currentTime <= line.endTime
    );
  };

  const currentIndex = getCurrentLyricIndex();

  const formatTimeWithMilliseconds = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const ms = Math.floor(milliseconds % 1000);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const isInLoopRange = (line: LyricLine) => {
    if (typeof loopStart !== 'number' || typeof loopEnd !== 'number') return false;
    return line.startTime >= loopStart && line.endTime <= loopEnd;
  };

  return (
    <div className="lyrics-container h-96 overflow-y-auto bg-gray-900 rounded-lg p-4 shadow-lg">
      {isMultiSelectMode && (
        <div className="mb-4 p-3 bg-orange-900/30 border border-orange-500/30 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-400 font-medium">📝 Multi-Select Mode</span>
            <span className="text-orange-300">
              Click lyrics to select • {selectedLyrics.length} selected
            </span>
          </div>
        </div>
      )}
      
      {isLooping && typeof loopStart === 'number' && typeof loopEnd === 'number' && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-400 font-medium">🔄 Loop Active</span>
            <span className="text-green-300 font-mono">
              {formatTimeWithMilliseconds(loopStart)} → {formatTimeWithMilliseconds(loopEnd)}
            </span>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {lyrics.map((line, index) => {
          const isCurrentlyPlaying = index === currentIndex;
          const isInLoop = isInLoopRange(line);
          const isPassed = currentTime > line.endTime;
          const isSelected = selectedLyrics.includes(line.id);
          
          const handleClick = () => {
            if (isMultiSelectMode) {
              onToggleSelection?.(line.id);
            } else {
              onLyricClick?.(line.startTime);
            }
          };
          
          return (
            <div
              key={line.id}
              onClick={handleClick}
              className={`
                group lyric-line p-3 rounded-lg transition-all duration-300 ease-in-out relative cursor-pointer
                ${isCurrentlyPlaying
                  ? 'bg-blue-600 text-white scale-105 shadow-lg font-semibold'
                  : isPassed
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }
                ${isInLoop && isLooping ? 'ring-2 ring-green-500/50' : ''}
                ${isSelected ? 'ring-2 ring-orange-500 bg-orange-900/20' : ''}
                ${isMultiSelectMode ? 'hover:ring-1 hover:ring-orange-300' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isMultiSelectMode && (
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center text-xs ${
                      isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-400'
                    }`}>
                      {isSelected && '✓'}
                    </div>
                  )}
                  <span 
                    className="text-sm font-mono font-medium hover:text-blue-300"
                    onClick={(e) => {
                      if (!isMultiSelectMode) {
                        e.stopPropagation();
                        onLyricClick?.(line.startTime);
                      }
                    }}
                  >
                    {formatTimeWithMilliseconds(line.startTime)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-gray-500">
                    {formatTimeWithMilliseconds(line.endTime)}
                  </span>
                  {onSetLoop && !isMultiSelectMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetLoop(line);
                      }}
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Loop this lyric"
                    >
                      🔄
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-1 text-lg leading-relaxed">{line.text}</div>
            </div>
          );
        })}
        {lyrics.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-xl mb-2">🎵</div>
            <p>No lyrics available</p>
            <p className="text-sm mt-2">Add lyrics to see them synchronized with the music</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LyricsDisplay;
