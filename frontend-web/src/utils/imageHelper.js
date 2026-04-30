import BACKEND_URL from '../config/backend';

export const getImageUrl = (path) => {
  if (!path) return null;
  // Already absolute URL
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Relative path – prepend backend base URL
  return `${BACKEND_URL}${path}`;
};