import { createContext, useContext, useState } from "react";

// Create context
const FavoritesContext = createContext();

// Provider component
export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  const addFavorite = (item) => {
    setFavorites((prev) => [...prev, item]);
  };

  const removeFavorite = (itemId) => {
    setFavorites((prev) => prev.filter((f) => f.id !== itemId));
  };

  const isFavorite = (itemId) => {
    return favorites.some((f) => f.id === itemId);
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, addFavorite, removeFavorite, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

// custom hook para madaling gamitin
export const useFavorites = () => useContext(FavoritesContext);
