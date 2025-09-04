// Utility function to get the correct base path for asset URLs
export function getAssetPath(path: string): string {
  const basePath = import.meta.env.PROD ? '/chantmix_tracker' : ''
  return `${basePath}${path}`
}
