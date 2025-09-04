import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: Index,
})

interface Chant {
  id: string
  title: string
  file: string
  contributor: string
  tags: string[]
  description: string
}

interface ChantsData {
  chants: Chant[]
}

function Index() {
  const [chants, setChants] = useState<Chant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchChants = async () => {
      try {
        const response = await fetch('/data/index.json')
        if (!response.ok) {
          throw new Error('Failed to fetch chants data')
        }
        const data: ChantsData = await response.json()
        setChants(data.chants)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchChants()
  }, [])

  const filteredChants = chants.filter(chant =>
    chant.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chant.contributor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chant.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    chant.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chants...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Chants</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">YouTube Chant Mix</h1>
              <p className="text-gray-600 mt-1">Discover and play synchronized chant lyrics</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/new"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Create New Chant
              </Link>
              <a
                href="/editor"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Advanced Editor
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search chants by title, contributor, tags, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Chants Grid */}
        {filteredChants.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No chants found' : 'No chants available'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms or browse all chants'
                : 'Check back later for new chant mixes!'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {searchTerm ? `Search Results (${filteredChants.length})` : `All Chants (${filteredChants.length})`}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredChants.map((chant) => (
                <div
                  key={chant.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 flex-1">
                        {chant.title}
                      </h3>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">By:</span> {chant.contributor}
                      </p>
                    </div>

                    {chant.description && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {chant.description}
                        </p>
                      </div>
                    )}

                    {chant.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {chant.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {chant.tags.length > 3 && (
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              +{chant.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link
                        to="/chant/$id"
                        params={{ id: chant.id }}
                        className="flex-1 bg-blue-500 hover:bg-blue-700 text-white text-center font-bold py-2 px-4 rounded transition-colors"
                      >
                        Play Chant
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}