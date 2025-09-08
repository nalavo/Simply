import React, { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import NewsRow from './NewsRow';
import { Heart, Loader2 } from 'lucide-react';

const Favorites = ({ user, viewMode }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await user.getIdToken();
      const response = await fetch('/api/user/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Mark all favorites as favorited
        const favoritesWithFlag = data.favorites.map(article => ({
          ...article,
          isFavorited: true
        }));
        setFavorites(favoritesWithFlag);
      } else {
        throw new Error('Failed to fetch favorites');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (article) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/user/favorites/${encodeURIComponent(article.original_url)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFavorites(prev => prev.filter(fav => fav.original_url !== article.original_url));
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  if (!user) {
    return (
      <div className="news-feed">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Favorites</h1>
            <p className="text-gray-600">Please sign in to view your saved articles.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="news-feed">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-feed">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium mb-2">Error loading favorites</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={fetchFavorites}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="news-feed">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Favorites</h1>
          <p className="text-gray-600">
            {favorites.length === 0 
              ? "You haven't saved any articles yet." 
              : `${favorites.length} saved article${favorites.length === 1 ? '' : 's'}`
            }
          </p>
        </div>

        {/* Favorites Grid/List */}
        {favorites.length > 0 ? (
          <div className={`${
            viewMode === 'card' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
          }`}>
            {favorites.map((article, index) => (
              viewMode === 'card' ? (
                <NewsCard
                  key={`${article.original_url}-${index}`}
                  article={article}
                  user={user}
                  onRemoveFavorite={handleRemoveFavorite}
                />
              ) : (
                <NewsRow
                  key={`${article.original_url}-${index}`}
                  article={article}
                  user={user}
                  onRemoveFavorite={handleRemoveFavorite}
                />
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h2>
            <p className="text-gray-600 mb-4">
              Start browsing articles and click the heart icon to save your favorites.
            </p>
            <a 
              href="/" 
              className="btn-primary"
            >
              Browse Articles
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites; 