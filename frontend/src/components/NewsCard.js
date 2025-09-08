// NewsCard component

import React, { useState } from 'react';
import { Heart, ExternalLink, Clock } from 'lucide-react';

const NewsCard = ({ article, user, onFavorite, onRemoveFavorite }) => {

  const [showModal, setShowModal] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [journalEntry, setJournalEntry] = useState('');
  const [simplified, setSimplified] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  // Removed unused variable

  const [showFullContent, setShowFullContent] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [analysisError, setAnalysisError] = useState(null);

  // Calculate reading time based on content length
  const calculateReadingTime = (text) => {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = text.split(' ').length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
  };

  // Get reading time for the article
  const getReadingTime = () => {
    if (simplified?.full_content) {
      return calculateReadingTime(simplified.full_content);
    }
    if (article.content) {
      return calculateReadingTime(article.content);
    }
    return calculateReadingTime(article.title + ' ' + (article.description || ''));
  };

  // Track article read
  const trackArticleRead = () => {
    const today = new Date().toDateString();
    const readingStats = JSON.parse(localStorage.getItem('readingStats') || '{}');
    
    if (!readingStats[today]) {
      readingStats[today] = {
        articlesRead: 0,
        totalReadingTime: 0,
        lastReadDate: today
      };
    }
    
    readingStats[today].articlesRead += 1;
    readingStats[today].totalReadingTime += getReadingTime();
    
    // Calculate streak
    const dates = Object.keys(readingStats).sort();
    let streak = 0;
    const todayDate = new Date();
    
    for (let i = dates.length - 1; i >= 0; i--) {
      const date = new Date(dates[i]);
      const diffDays = Math.floor((todayDate - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    readingStats.currentStreak = streak;
    localStorage.setItem('readingStats', JSON.stringify(readingStats));
  };

  // Helper functions to get article fields regardless of format
  const getTitle = () => {
    if (simplified && simplified.simplified_title) {
      return simplified.simplified_title;
    }
    return article.original_title || article.title || 'No title available';
  };

  const getSummary = () => {
    if (simplified && simplified.simplified_summary) {
      return simplified.simplified_summary;
    }
    return article.original_summary || article.description || 'No summary available';
  };

  const getImage = () => {
    const imageUrl = article.original_image || article.urlToImage;
    // Only return valid image URLs (allow our generated placeholders)
    if (imageUrl && imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return null;
  };

  const getUrl = () => {
    return article.original_url || article.url || null;
  };

  const getSource = () => {
    return article.original_source || article.source || 'Unknown source';
  };

  const getPublishedAt = () => {
    return article.published_at || article.publishedAt || null;
  };





  const getPros = () => {
    if (simplified && simplified.pros) {
      return simplified.pros;
    }
    return article.pros || [];
  };

  const getCons = () => {
    if (simplified && simplified.cons) {
      return simplified.cons;
    }
    return article.cons || [];
  };

  const handleFavoriteClick = () => {
    if (article.isFavorited) {
      onRemoveFavorite(article);
    } else {
      onFavorite(article);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCardClick = () => {
    setShowModal(true);
    trackArticleRead(); // Track when user opens article
    
    // Generate analysis automatically when modal opens
    if (!simplified) {
      setIsLoadingAnalysis(true); // Show loading immediately
      generateAnalysis();
    }
  };

  const generateAnalysis = async () => {
    // Check if we already have analysis for this article
    const cacheKey = `analysis_${article.url || article.id}`;
    const cachedAnalysis = localStorage.getItem(cacheKey);
    
    if (cachedAnalysis) {
      try {
        const parsed = JSON.parse(cachedAnalysis);
        setSimplified(parsed);
        setIsLoadingAnalysis(false);
        return;
      } catch (e) {
        // Invalid cache, continue to generate
      }
    }

    setIsLoadingAnalysis(true);
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      setIsLoadingAnalysis(false);
      console.error('Analysis generation timed out');
    }, 30000); // 30 second timeout
    
    try {
      const response = await fetch('/api/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article })
      });
      
      clearTimeout(timeoutId); // Clear timeout on success
      
      if (!response.ok) {
        throw new Error('Failed to generate analysis');
      }
      const data = await response.json();
      setSimplified(data);
      
      // Cache the analysis for future use
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      clearTimeout(timeoutId); // Clear timeout on error
      console.error('Error generating analysis:', error);
      
      // Handle retry logic
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          generateAnalysis();
        }, 1000 * (retryCount + 1)); // Exponential backoff
      } else {
        setAnalysisError('Failed to generate analysis. Please try again later.');
        setRetryCount(0);
      }
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Helper to get the full article content
  const getFullContent = () => {
    return article.full_content || article.content || '';
  };



  return (
    <>
      <div 
        className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Image */}
        {getImage() ? (
          <div className="mb-2">
            <img
              src={getImage()}
              alt={getTitle()}
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="mb-2">
            <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <div className="text-center text-blue-600">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-sm font-medium">No Image Available</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-2">
          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 flex items-start">
            {getTitle()}
            {(article.videoUrl || article.video_url) && (
              <div className="ml-2 flex-shrink-0">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Video
                </span>
              </div>
            )}
          </h3>




          {/* Meta Information */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              {getSource() && (
                <div className="flex items-center space-x-1">
                  <span>{getSource()}</span>
                </div>
              )}
              {getPublishedAt() && (
                <div className="flex items-center space-x-1">
                  <span>{formatDate(getPublishedAt())}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <span>{getReadingTime()} min read</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {user && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavoriteClick();
                  }}
                  className={`p-1 rounded transition-colors ${
                    article.isFavorited
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-400 hover:text-red-500'
                  }`}
                  title={article.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-4 h-4 ${article.isFavorited ? 'fill-current' : ''}`} />
                </button>
              )}
              {user && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowJournal(true);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Add to journal"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </button>
              )}
              {getUrl() && (
                <a
                  href={getUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Read original article"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for full article details */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {getTitle()}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{getSource()}</span>
                    <span>•</span>
                    <span>{formatDate(getPublishedAt())}</span>
                    <span>•</span>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{getReadingTime()} min read</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              {/* Image */}
              {getImage() ? (
                <div className="mb-6">
                  <img
                    src={getImage()}
                    alt={getTitle()}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-blue-600">
                      <svg className="w-20 h-20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-lg font-medium">No Image Available</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Links */}
              {(article.videoUrl || article.video_url) && (
                <div className="mb-6">
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      Watch Video
                    </h4>
                    <a 
                      href={article.videoUrl || article.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Play Video
                    </a>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="space-y-6">
                {/* Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-800 leading-relaxed">
                      {getSummary()}
                    </p>
                  </div>
                </div>

                {/* Full Article Content */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Full Article</h3>
                    <a
                      href={getUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      title="Read Original Article"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {simplified && simplified.simplified_full_content
                        ? simplified.simplified_full_content
                        : showFullContent 
                          ? getFullContent()
                          : getFullContent().length > 500 
                            ? getFullContent().substring(0, 500) + '...'
                            : getFullContent()
                      }
                    </p>
                    {getFullContent().length > 500 && (
                      <button
                        onClick={() => setShowFullContent(!showFullContent)}
                        className="mt-3 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        {showFullContent ? 'Show Less' : 'Read More'}
                      </button>
                    )}
                  </div>
                </div>



                {/* Analysis Section */}
                <div className="mt-6">
                  {isLoadingAnalysis ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Generating analysis...</p>
                      <p className="text-sm text-gray-500 mt-2">Please wait</p>
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                        </div>
                      </div>
                    </div>
                  ) : analysisError ? (
                    <div className="text-center py-6">
                      <div className="text-red-500 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <p className="text-red-600 mb-4">{analysisError}</p>
                      <button
                        onClick={() => {
                          setAnalysisError(null);
                          setRetryCount(0);
                          generateAnalysis();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Retry Analysis
                      </button>
                    </div>
                  ) : simplified && (getPros().length > 0 || getCons().length > 0) ? (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-green-50 p-4 rounded-lg">
                                                  <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                          <span className="mr-2">✓</span>
                          Pros
                        </h4>
                          <ul className="list-disc list-inside text-green-800 space-y-2">
                            {getPros().map((point, idx) => (
                              <li key={idx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                                                  <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                          <span className="mr-2">⚠</span>
                          Cons
                        </h4>
                          <ul className="list-disc list-inside text-red-800 space-y-2">
                            {getCons().map((point, idx) => (
                              <li key={idx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Generating analysis...</p>
                      <p className="text-sm text-gray-500 mt-2">Please wait</p>
                    </div>
                  )}
                </div>

                {/* Meta Information */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-6">
                      {getSource() && (
                        <div className="flex items-center space-x-2">
                          <span>{getSource()}</span>
                        </div>
                      )}
                      {getPublishedAt() && (
                        <div className="flex items-center space-x-2">
                          <span>{formatDate(getPublishedAt())}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                      {user && (
                        <button
                          onClick={handleFavoriteClick}
                          className={`p-2 rounded transition-colors ${
                            article.isFavorited
                              ? 'text-red-500 hover:text-red-600'
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                          title={article.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart className={`w-5 h-5 ${article.isFavorited ? 'fill-current' : ''}`} />
                        </button>
                      )}
                      {getUrl() && (
                        <a
                          href={getUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Read original article"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Journal Modal */}
      {showJournal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Journal Entry
                </h2>
                <button
                  onClick={() => setShowJournal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{getTitle()}</h3>
                <p className="text-sm text-gray-600 mb-4">{getSource()} • {formatDate(getPublishedAt())}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Notes
                </label>
                <textarea
                  value={journalEntry}
                  onChange={(e) => setJournalEntry(e.target.value)}
                  placeholder="Write your thoughts, questions, or insights about this article..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowJournal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save journal entry
                    const entry = {
                      id: Date.now(),
                      articleId: article.url || article.id,
                      title: getTitle(),
                      source: getSource(),
                      date: getPublishedAt(),
                      url: getUrl(),
                      image: getImage(),
                      notes: journalEntry,
                      timestamp: new Date().toISOString()
                    };
                    
                    // Get existing journal entries
                    const existingEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
                    const updatedEntries = [...existingEntries, entry];
                    localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
                    
                    setShowJournal(false);
                    setJournalEntry('');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewsCard;
