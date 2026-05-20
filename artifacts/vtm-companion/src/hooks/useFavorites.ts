import { useState, useEffect } from 'react';
import { FavoriteType, makeFavoriteKey } from '@/utils/favorites';

const STORAGE_KEY = 'vtm-favorites';

function readFavorites(): Record<string, boolean> {
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : {};
  } catch (error) {
    console.warn('Error reading localStorage', error);
    return {};
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => readFavorites());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.warn('Error setting localStorage', error);
    }
  }, [favorites]);

  // Keep in sync with manual edits (e.g. the Settings "Clear Favorites" button
  // dispatches a 'storage' event after wiping the key).
  useEffect(() => {
    const handler = () => setFavorites(readFavorites());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  /** Toggle a raw favorite key (legacy API used by clans/disciplines/rules). */
  const toggleFavorite = (id: string) => {
    if (!id) return;
    setFavorites(prev => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    });
  };

  const isFavorite = (id: string) => !!favorites[id];

  /** Toggle a typed favorite (namespaces user-content ids to avoid collisions). */
  const toggleFavoriteTyped = (type: FavoriteType, targetId: string) => {
    toggleFavorite(makeFavoriteKey(type, targetId));
  };

  const isFavoriteTyped = (type: FavoriteType, targetId: string) =>
    isFavorite(makeFavoriteKey(type, targetId));

  return { favorites, toggleFavorite, isFavorite, toggleFavoriteTyped, isFavoriteTyped };
}
