import { useState, useEffect } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>(() => {
    try {
      const item = window.localStorage.getItem('vtm-favorites');
      return item ? JSON.parse(item) : {};
    } catch (error) {
      console.warn("Error reading localStorage", error);
      return {};
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('vtm-favorites', JSON.stringify(favorites));
    } catch (error) {
      console.warn("Error setting localStorage", error);
    }
  }, [favorites]);

  const toggleFavorite = (id: string) => {
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

  return { favorites, toggleFavorite, isFavorite };
}