import React, { useState, useEffect, useCallback } from 'react';
import NewsCard from './NewsCard';
import NewsRow from './NewsRow';
import { Loader2, Filter, ChevronDown } from 'lucide-react';

const NewsFeed = ({ viewMode, category, user, userPreferences, searchQuery, onCategoryChange }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy] = useState('publishedAt');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(category || 'general');

  const fetchArticles = useCallback(async (pageNum, reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        category: category,
        page: pageNum,
        page_size: 25,  // Optimized for NewsAPI limits while still getting good content
        sortBy: sortBy
      });

      // Add search query if provided
      if (searchQuery) {
        params.append('q', searchQuery);
      }

      const response = await fetch(`/api/news?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      
      if (reset) {
        setArticles(data.articles || []);
      } else {
        setArticles(prev => [...prev, ...(data.articles || [])]);
      }
      
      // Set hasMore to true if we got a full page of articles (indicating there might be more)
      setHasMore((data.articles || []).length >= 25);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category, searchQuery, sortBy]);

  useEffect(() => {
    setPage(1);
    setArticles([]);
    fetchArticles(1, true);
  }, [fetchArticles]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategoryDropdown && !event.target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);


  const loadMore = () => {
    if (!loading && hasMore) {
      fetchArticles(page + 1);
    }
  };

  const handleFavorite = async (article) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(article)
      });

      if (response.ok) {
        // Update the article in the list to show it's favorited
        setArticles(prev => 
          prev.map(a => 
            a.original_url === article.original_url 
              ? { ...a, isFavorited: true }
              : a
          )
        );
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const handleRemoveFavorite = async (article) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/user/favorites/${encodeURIComponent(article.original_url)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update the article in the list to show it's not favorited
        setArticles(prev => 
          prev.map(a => 
            a.original_url === article.original_url 
              ? { ...a, isFavorited: false }
              : a
          )
        );
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  if (error) {
    return (
      <div className="news-feed">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium mb-2">Error loading articles</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => fetchArticles(1, true)}
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
      <div className="w-full px-1">
        {/* Category Header */}
        <div className="mb-1 mt-0">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {searchQuery 
                ? `Search Results for "${searchQuery}"`
                : category === 'general'
                  ? 'Top Stories'
                  : category.charAt(0).toUpperCase() + category.slice(1)}
            </h1>
            
            {/* Categories Button - Aligned with heading */}
            <div className="relative category-dropdown">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Categories</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showCategoryDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    {[
                      { value: 'general', label: 'Top Stories' },
                      { value: 'business', label: 'Business' },
                      { value: 'technology', label: 'Technology' },
                      { value: 'sports', label: 'Sports' },
                      { value: 'entertainment', label: 'Entertainment' },
                      { value: 'health', label: 'Health' },
                      { value: 'science', label: 'Science' },
                      { value: 'politics', label: 'Politics' }
                    ].map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => {
                          setSelectedCategory(cat.value);
                          setShowCategoryDropdown(false);
                          if (onCategoryChange) {
                            onCategoryChange(cat.value);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedCategory === cat.value
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {searchQuery && (
            <p className="text-gray-600">
              Showing results from {category === 'general' ? 'all categories' : category}
            </p>
          )}
        </div>

        {/* Articles Grid/List */}
        <div className={`${
          viewMode === 'card' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1' 
            : 'space-y-4'
        }`}>
          {articles.map((article, index) => (
            viewMode === 'card' ? (
              <NewsCard
                key={`${article.original_url}-${index}`}
                article={article}
                user={user}
                onFavorite={handleFavorite}
                onRemoveFavorite={handleRemoveFavorite}
              />
            ) : (
              <NewsRow
                key={`${article.original_url}-${index}`}
                article={article}
                user={user}
                onFavorite={handleFavorite}
                onRemoveFavorite={handleRemoveFavorite}
              />
            )
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        )}

        {/* Load More Button */}
        {!loading && hasMore && (
          <div className="flex justify-center py-8">
            <button
              onClick={loadMore}
              className="btn-secondary"
            >
              Load More Articles
            </button>
          </div>
        )}

        {/* No More Articles */}
        {!loading && !hasMore && articles.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            No more articles to load
          </div>
        )}

        {/* Empty State */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No articles found</div>
            <div className="text-gray-400">Try selecting a different category</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsFeed; 