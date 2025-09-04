import React, { useState } from 'react';
import type { LyricLine } from '../types';

interface LyricsEditorProps {
  lyrics: LyricLine[];
  currentTime: number;
  onLyricsChange: (lyrics: LyricLine[]) => void;
  onSetLoop?: (lyric: LyricLine) => void;
  selectedLyrics?: string[];
  isMultiSelectMode?: boolean;
  onToggleSelection?: (lyricId: string) => void;
}

const LyricsEditor: React.FC<LyricsEditorProps> = ({
  lyrics,
  currentTime,
  onLyricsChange,
  onSetLoop,
  selectedLyrics = [],
  isMultiSelectMode = false,
  onToggleSelection,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLyricText, setNewLyricText] = useState('');

  const formatTimeInput = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const parseTimeInput = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    
    const minutes = parseInt(parts[0]) || 0;
    const secondsParts = parts[1].split('.');
    const seconds = parseInt(secondsParts[0]) || 0;
    const centiseconds = parseInt(secondsParts[1]) || 0;
    
    return (minutes * 60 + seconds) * 1000 + centiseconds * 10;
  };

  const addNewLyric = () => {
    if (!newLyricText.trim()) return;

    const newLyric: LyricLine = {
      id: `lyric-${Date.now()}`,
      startTime: currentTime,
      endTime: currentTime + 3000, // Default 3 seconds duration
      text: newLyricText.trim(),
    };

    const updatedLyrics = [...lyrics, newLyric].sort((a, b) => a.startTime - b.startTime);
    onLyricsChange(updatedLyrics);
    setNewLyricText('');
  };

  const updateLyric = (id: string, field: keyof LyricLine, value: string | number) => {
    const updatedLyrics = lyrics.map((lyric) =>
      lyric.id === id ? { ...lyric, [field]: value } : lyric
    );
    onLyricsChange(updatedLyrics);
  };

  const deleteLyric = (id: string) => {
    const updatedLyrics = lyrics.filter((lyric) => lyric.id !== id);
    onLyricsChange(updatedLyrics);
  };

  const getCurrentTimeFormatted = () => formatTimeInput(currentTime);

  return (
    <div className="lyrics-editor bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Lyrics Editor</h3>
      
      {/* Add new lyric */}
      <div className="add-lyric-section mb-6 p-4 bg-gray-700 rounded-lg">
        <h4 className="text-lg font-medium text-white mb-3">Add New Lyric</h4>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <div className="flex items-center space-x-2">
              <span>Current Time:</span>
              <code className="bg-gray-900 px-2 py-1 rounded text-blue-400">
                {getCurrentTimeFormatted()}
              </code>
              <span className="text-gray-500">({Math.floor(currentTime)}ms)</span>
            </div>
            <button
              onClick={() => setNewLyricText(prev => prev ? prev : '')}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
              title="Use current time as start time"
            >
              📍 Use Current Time
            </button>
          </div>
          <textarea
            value={newLyricText}
            onChange={(e) => setNewLyricText(e.target.value)}
            placeholder="Enter lyric text..."
            className="w-full p-3 bg-gray-900 text-white rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={2}
          />
          <button
            onClick={addNewLyric}
            disabled={!newLyricText.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Add Lyric at Current Time
          </button>
        </div>
      </div>

      {/* Multi-select info */}
      {isMultiSelectMode && (
        <div className="mb-4 p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
          <div className="text-sm text-orange-300">
            📝 Multi-select mode: Click checkboxes to select multiple lyrics for batch looping
          </div>
        </div>
      )}

      {/* Existing lyrics */}
      <div className="existing-lyrics">
        <h4 className="text-lg font-medium text-white mb-3">Existing Lyrics ({lyrics.length})</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {lyrics.map((lyric) => {
            const isSelected = selectedLyrics.includes(lyric.id);
            
            return (
              <div
                key={lyric.id}
                className={`lyric-item p-4 bg-gray-700 rounded-lg border border-gray-600 ${
                  isSelected ? 'ring-2 ring-orange-500 bg-orange-900/20' : ''
                }`}
              >
                {editingId === lyric.id ? (
                  <div className="editing-mode space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Start Time
                        </label>
                        <div className="flex space-x-1">
                          <input
                            type="text"
                            value={formatTimeInput(lyric.startTime)}
                            onChange={(e) =>
                              updateLyric(lyric.id, 'startTime', parseTimeInput(e.target.value))
                            }
                            className="flex-1 p-2 bg-gray-900 text-white rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="MM:SS.CC"
                          />
                          <button
                            onClick={() => updateLyric(lyric.id, 'startTime', currentTime)}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-2 rounded text-xs"
                            title="Set to current time"
                          >
                            📍
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          End Time
                        </label>
                        <div className="flex space-x-1">
                          <input
                            type="text"
                            value={formatTimeInput(lyric.endTime)}
                            onChange={(e) =>
                              updateLyric(lyric.id, 'endTime', parseTimeInput(e.target.value))
                            }
                            className="flex-1 p-2 bg-gray-900 text-white rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="MM:SS.CC"
                          />
                          <button
                            onClick={() => updateLyric(lyric.id, 'endTime', currentTime)}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-2 rounded text-xs"
                            title="Set to current time"
                          >
                            📍
                          </button>
                        </div>
                      </div>
                    </div>
                    <textarea
                      value={lyric.text}
                      onChange={(e) => updateLyric(lyric.id, 'text', e.target.value)}
                      className="w-full p-3 bg-gray-900 text-white rounded resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-mode">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        {isMultiSelectMode && onToggleSelection && (
                          <div 
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs cursor-pointer ${
                              isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-400 hover:border-orange-400'
                            }`}
                            onClick={() => onToggleSelection(lyric.id)}
                          >
                            {isSelected && '✓'}
                          </div>
                        )}
                        <div className="flex space-x-4 text-xs text-gray-400">
                          <span>{formatTimeInput(lyric.startTime)}</span>
                          <span>→</span>
                          <span>{formatTimeInput(lyric.endTime)}</span>
                          <span className="text-gray-500">
                            ({Math.round((lyric.endTime - lyric.startTime) / 1000)}s)
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingId(lyric.id)}
                          className="text-blue-400 hover:text-blue-300 text-xs"
                        >
                          Edit
                        </button>
                        {onSetLoop && !isMultiSelectMode && (
                          <button
                            onClick={() => onSetLoop(lyric)}
                            className="text-purple-400 hover:text-purple-300 text-xs"
                            title="Loop this lyric"
                          >
                            🔄 Loop
                          </button>
                        )}
                        <button
                          onClick={() => deleteLyric(lyric.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="text-white">{lyric.text}</div>
                  </div>
                )}
              </div>
            );
          })}
          {lyrics.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <div className="text-2xl mb-2">📝</div>
              <p>No lyrics yet</p>
              <p className="text-sm mt-2">Add your first lyric using the form above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LyricsEditor;
