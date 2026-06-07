import { useState, useEffect } from 'react';

// Normalize hash from URL
function getHashFromUrl(): string {
  const rawHash = window.location.hash;
  if (!rawHash || rawHash === '#') {
    return '/';
  }
  // Remove leading # and ensure it starts with /
  let path = rawHash.slice(1);
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return path;
}

export function useHashRouter() {
  const [hash, setHash] = useState(getHashFromUrl);

  useEffect(() => {
    const handleHashChange = () => {
      setHash(getHashFromUrl());
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Also re-read hash on mount to ensure consistency
    setHash(getHashFromUrl());

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    window.location.hash = normalizedPath;
  };

  return { hash, navigate };
}

// Generate a clean slug from a name
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[™️®©]/g, '') // Remove special symbols
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
