import alea from 'alea';

export function getMapSeed(): number {
  const urlParams = new URLSearchParams(window.location.search);
  const seedParam = urlParams.get('seed');

  if (seedParam !== null) {
    const parsed = parseInt(seedParam, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return Math.floor(Date.now() * Math.random()) % 2147483647 || 1;
}

export function updateUrlWithSeed(seed: number): void {
  const url = new URL(window.location.href);
  url.searchParams.set('seed', seed.toString());
  window.history.replaceState({}, '', url.toString());
}

export function seededRandom(seed: number): () => number {
  return alea(seed);
}
