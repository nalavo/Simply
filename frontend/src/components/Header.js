import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Grid, List, Heart, Settings, User, LogOut, ChevronDown, Clock, TrendingUp } from 'lucide-react';

const Header = ({ user, onLogin, onLogout, viewMode, onViewModeChange, onSearch, onReset, onCategoryChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [readingGoals, setReadingGoals] = useState({
    dailyGoal: parseInt(localStorage.getItem('dailyReadingGoal') || '5'),
    weeklyGoal: parseInt(localStorage.getItem('weeklyReadingGoal') || '20'),
    monthlyGoal: parseInt(localStorage.getItem('monthlyReadingGoal') || '80')
  });
  
  // Get reading stats from localStorage
  const getReadingStats = () => {
    const today = new Date().toDateString();
    const readingStats = JSON.parse(localStorage.getItem('readingStats') || '{}');
    
    const todayStats = readingStats[today] || { articlesRead: 0, totalReadingTime: 0 };
    const currentStreak = readingStats.currentStreak || 0;
    
    // Calculate weekly goal progress using current reading goals
    const weeklyGoal = readingGoals.weeklyGoal;
    const thisWeek = Object.keys(readingStats).filter(date => {
      const dateObj = new Date(date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return dateObj >= weekAgo;
    });
    
    const weeklyArticles = thisWeek.reduce((total, date) => {
      return total + (readingStats[date]?.articlesRead || 0);
    }, 0);
    
    // Calculate monthly goal progress
    const monthlyGoal = readingGoals.monthlyGoal;
    const thisMonth = Object.keys(readingStats).filter(date => {
      const dateObj = new Date(date);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return dateObj >= monthAgo;
    });
    
    const monthlyArticles = thisMonth.reduce((total, date) => {
      return total + (readingStats[date]?.articlesRead || 0);
    }, 0);
    
    const weeklyProgress = Math.min((weeklyArticles / weeklyGoal) * 100, 100);
    const monthlyProgress = Math.min((monthlyArticles / monthlyGoal) * 100, 100);
    
    return {
      todayArticles: todayStats.articlesRead,
      streak: currentStreak,
      totalReadingTime: todayStats.totalReadingTime,
      weeklyArticles,
      weeklyGoal,
      weeklyProgress,
      monthlyArticles,
      monthlyGoal,
      monthlyProgress
    };
  };
  
  const stats = getReadingStats();
  
  // Check for achievements
  const getAchievements = () => {
    const readingStats = JSON.parse(localStorage.getItem('readingStats') || '{}');
    const achievements = [];
    
    // Calculate total articles read
    const totalArticles = Object.values(readingStats).reduce((total, dayStats) => {
      return total + (dayStats.articlesRead || 0);
    }, 0);
    
    // Check for achievements
    if (stats.streak >= 7) {
      achievements.push({ icon: '🏆', title: '7-Day Streak', color: 'text-yellow-600' });
    }
    if (totalArticles >= 50) {
      achievements.push({ icon: '📚', title: 'Read 50 Articles', color: 'text-blue-600' });
    }
    if (stats.todayArticles >= 5) {
      achievements.push({ icon: '⚡', title: 'Speed Reader', color: 'text-green-600' });
    }
    if (stats.weeklyArticles >= stats.weeklyGoal) {
      achievements.push({ icon: '🎯', title: 'Weekly Goal Met', color: 'text-purple-600' });
    }
    if (stats.totalReadingTime >= 60) {
      achievements.push({ icon: '⏰', title: 'Hour Reader', color: 'text-orange-600' });
    }
    
    return achievements.slice(-3); // Show last 3 achievements
  };
  
  const achievements = getAchievements();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // Clear search if input is empty
    if (!e.target.value.trim()) {
      onSearch('');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSettings && !event.target.closest('.settings-dropdown')) {
        setShowSettings(false);
      }
      if (showAchievements && !event.target.closest('.achievements-modal')) {
        setShowAchievements(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings, showAchievements]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="flex items-center relative ml-[-150px]"
              onClick={() => {
                if (onReset) {
                  onReset();
                }
                setSearchQuery('');
              }}
            >
              <div className="relative flex items-center">
                <img
                  src="/simply-logo.png"
                  alt="Simply Logo"
                  className="h-[300px] w-auto object-contain transition-transform duration-200 hover:scale-105"
                  style={{ maxHeight: '300px' }}
                />
                {/* Slogan with hover effect */}
                <div className="logo-slogan absolute left-full -ml-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                  News, made easy
                </div>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 flex justify-end ml-4, ml-2, ml-0 ">
            <form onSubmit={handleSearch} className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 text-sm"
                placeholder="Search news..."
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <span className="sr-only">Search</span>
              </button>
            </form>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {user && (
              <>
                <Link 
                  to="/favorites" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                >
                  <Heart className="w-4 h-4" />
                  <span>Favorites</span>
                </Link>
                <Link 
                  to="/journal" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Journal</span>
                </Link>
                <Link 
                  to="/preferences" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
                <Link 
                  to="/about" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                >
                  <span>About</span>
                </Link>
              </>
            )}
          </nav>

          {/* View Mode Toggle and User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('card')}
                className={`p-2 rounded-md transition-colors group relative ${
                  viewMode === 'card' 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Card View - Grid layout
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-b-4 border-l-4 border-r-4 border-transparent border-b-gray-800"></div>
                </div>
              </button>
              <button
                onClick={() => onViewModeChange('row')}
                className={`p-2 rounded-md transition-colors group relative ${
                  viewMode === 'row' 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Row View - List layout
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-b-4 border-l-4 border-r-4 border-transparent border-b-gray-800"></div>
                </div>
              </button>
            </div>

            {/* Quick Model Switcher */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.open('/preferences', '_blank')}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors group relative"
                title="Switch AI Model for faster analysis"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Switch AI Model
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-b-4 border-l-4 border-r-4 border-transparent border-b-gray-800"></div>
                </div>
              </button>
            </div>

            {/* Reading Stats Indicator */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-1 group relative">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">{stats.todayArticles}</span>
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Articles read today
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-b-4 border-l-4 border-r-4 border-transparent border-b-gray-800"></div>
                </div>
              </div>
              <div className="flex items-center space-x-1 group relative">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">{stats.streak}</span>
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Reading streak (consecutive days)
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-b-4 border-l-4 border-r-4 border-transparent border-b-gray-800"></div>
                </div>
              </div>
            </div>

            {/* Sign In Button */}
            {!user ? (
              <button
                onClick={onLogin}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Sign In</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">{user.email}</span>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            )}

            {/* Settings Button - Isolated on Far Right */}
            <div className="relative settings-dropdown">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Settings</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
              </button>
                
              {showSettings && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
                    


                    {/* Subscription Status */}
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">Free Plan</h4>
                          <p className="text-xs text-yellow-600">10 articles per day</p>
                        </div>
                        <button className="px-3 py-1 bg-primary-600 text-white text-xs rounded-md hover:bg-primary-700">
                          Upgrade
                        </button>
                      </div>
                    </div>

                    {/* Reading Stats */}
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Reading Stats</h4>
                      <div className="space-y-2 text-xs text-blue-700">
                        <div className="flex justify-between">
                          <span>Articles Read Today:</span>
                          <span className="font-semibold">{stats.todayArticles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reading Streak:</span>
                          <span className="font-semibold">{stats.streak} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Reading Time:</span>
                          <span className="font-semibold">{stats.totalReadingTime} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weekly Goal:</span>
                          <span className="font-semibold">{stats.weeklyArticles}/{stats.weeklyGoal} articles</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Monthly Goal:</span>
                          <span className="font-semibold">{stats.monthlyArticles}/{stats.monthlyGoal} articles</span>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: `${stats.weeklyProgress}%`}}></div>
                      </div>
                      <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: `${stats.monthlyProgress}%`}}></div>
                      </div>
                    </div>

                    {/* Reading Goals */}
                    <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <h4 className="text-sm font-medium text-indigo-800 mb-2">Reading Goals</h4>
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-indigo-700">Daily Goal:</span>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={readingGoals.dailyGoal}
                              onChange={(e) => setReadingGoals(prev => ({...prev, dailyGoal: parseInt(e.target.value) || 1}))}
                              className="w-16 px-2 py-1 text-center border border-indigo-300 rounded text-xs"
                            />
                            <span className="text-indigo-600">articles</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-indigo-700">Weekly Goal:</span>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="5"
                              max="200"
                              value={readingGoals.weeklyGoal}
                              onChange={(e) => setReadingGoals(prev => ({...prev, weeklyGoal: parseInt(e.target.value) || 5}))}
                              className="w-16 px-2 py-1 text-center border border-indigo-300 rounded text-xs"
                            />
                            <span className="text-indigo-600">articles</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-indigo-700">Monthly Goal:</span>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="20"
                              max="800"
                              value={readingGoals.monthlyGoal}
                              onChange={(e) => setReadingGoals(prev => ({...prev, monthlyGoal: parseInt(e.target.value) || 20}))}
                              className="w-16 px-2 py-1 text-center border border-indigo-300 rounded text-xs"
                            />
                            <span className="text-indigo-600">articles</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Achievements */}
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-sm font-medium text-green-800 mb-2">Recent Achievements</h4>
                      <div className="space-y-1 text-xs text-green-700">
                        {achievements.map((achievement, index) => (
                          <div key={index} className="flex items-center">
                            <span className={`mr-2 ${achievement.color}`}>{achievement.icon}</span>
                            <span>{achievement.title}</span>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => setShowAchievements(true)}
                        className="w-full mt-3 px-3 py-2 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                      >
                        View All Achievements
                      </button>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <button 
                        onClick={() => {
                          // Store reading goals in localStorage
                          localStorage.setItem('dailyReadingGoal', readingGoals.dailyGoal.toString());
                          localStorage.setItem('weeklyReadingGoal', readingGoals.weeklyGoal.toString());
                          localStorage.setItem('monthlyReadingGoal', readingGoals.monthlyGoal.toString());
                          
                          // Close the dropdown
                          setShowSettings(false);
                          
                          // Show a brief success message
                          console.log('Reading goals saved successfully!');
                        }}
                        className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm cursor-pointer"
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Modal */}
      {showAchievements && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 achievements-modal"
          onClick={() => setShowAchievements(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🏆 All Achievements</h2>
              <button
                onClick={() => setShowAchievements(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Achievement Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Reading Streaks */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                  🔥 Reading Streaks
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-700">3-Day Streak</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.streak >= 3 ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.streak >= 3 ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-700">7-Day Streak</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.streak >= 7 ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.streak >= 7 ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-700">30-Day Streak</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.streak >= 30 ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.streak >= 30 ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reading Goals */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                  📚 Reading Goals
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">Read 25 Articles</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.totalReadingTime >= 25 ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.totalReadingTime >= 25 ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">Read 50 Articles</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.totalReadingTime >= 50 ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.totalReadingTime >= 50 ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">Read 100 Articles</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.totalReadingTime >= 100 ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.totalReadingTime >= 100 ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily Challenges */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                  ⚡ Daily Challenges
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700">Read 3 Articles Today</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.todayArticles >= 3 ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.todayArticles >= 3 ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700">Read 5 Articles Today</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.todayArticles >= 5 ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.todayArticles >= 5 ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700">Read 10 Articles Today</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.todayArticles >= 10 ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.todayArticles >= 10 ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weekly Goals */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                  🎯 Weekly Goals
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">Meet Weekly Goal</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.weeklyArticles >= stats.weeklyGoal ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.weeklyArticles >= stats.weeklyGoal ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">Exceed Weekly Goal</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.weeklyArticles >= stats.weeklyGoal * 1.5 ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.weeklyArticles >= stats.weeklyGoal * 1.5 ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">Double Weekly Goal</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.weeklyArticles >= stats.weeklyGoal * 2 ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.weeklyArticles >= stats.weeklyGoal * 2 ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Monthly Goals */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                  📅 Monthly Goals
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-700">Meet Monthly Goal</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.monthlyArticles >= stats.monthlyGoal ? 'bg-orange-200 text-orange-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.monthlyArticles >= stats.monthlyGoal ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-700">Exceed Monthly Goal</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.monthlyArticles >= stats.monthlyGoal * 1.5 ? 'bg-orange-200 text-orange-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.monthlyArticles >= stats.monthlyGoal * 1.5 ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-700">Double Monthly Goal</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stats.monthlyArticles >= stats.monthlyGoal * 2 ? 'bg-orange-200 text-orange-800' : 'bg-gray-200 text-gray-500'}`}>
                      {stats.monthlyArticles >= stats.monthlyGoal * 2 ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Your Progress</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.streak}</div>
                  <div className="text-xs text-gray-600">Day Streak</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.todayArticles}</div>
                  <div className="text-xs text-gray-600">Today</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.weeklyArticles}</div>
                  <div className="text-xs text-gray-600">This Week</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.monthlyArticles}</div>
                  <div className="text-xs text-gray-600">This Month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 