// Utility function to get the correct base path for asset URLs
export function getAssetPath(path: string): string {
  // Check if we're on GitHub Pages (has the repo name in URL)
  const isGitHubPages = window.location.pathname.includes('/chantmix_tracker/')
  const basePath = isGitHubPages ? '/chantmix_tracker' : ''
  return `${basePath}${path}`
}
