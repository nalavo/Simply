// Main React App

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Header from './components/Header';
import NewsFeed from './components/NewsFeed';
import LoginModal from './components/LoginModal';
import UserPreferences from './components/UserPreferences';
import Favorites from './components/Favorites';
import AboutPage from './components/AboutPage';
import Journal from './components/Journal';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [userPreferences, setUserPreferences] = useState({
    preferred_topics: ['general'],
    default_view: 'card'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Load user preferences
        loadUserPreferences();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/user/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const preferences = await response.json();
        setUserPreferences(preferences);
        setViewMode(preferences.default_view || 'card');
        setSelectedCategory(preferences.preferred_topics[0] || 'general');
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUserPreferences({
        preferred_topics: ['general'],
        default_view: 'card'
      });
      setViewMode('card');
      setSelectedCategory('general');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header 
          user={user} 
          onLogin={handleLogin} 
          onLogout={handleLogout}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onSearch={handleSearch}
          onReset={() => {
            setSelectedCategory('general');
            setSearchQuery('');
          }}
          onCategoryChange={setSelectedCategory}
        />
        
        <div className="h-screen pt-15">
          <main className="h-full overflow-y-auto">
            <Routes>
              <Route 
                path="/" 
                element={
                  <NewsFeed 
                    viewMode={viewMode}
                    category={selectedCategory}
                    user={user}
                    userPreferences={userPreferences}
                    searchQuery={searchQuery}
                    onCategoryChange={setSelectedCategory}
                  />
                } 
              />
              <Route 
                path="/favorites" 
                element={
                  <Favorites 
                    user={user}
                    viewMode={viewMode}
                  />
                } 
              />
              <Route 
                path="/preferences" 
                element={
                  <UserPreferences 
                    user={user}
                    preferences={userPreferences}
                    onPreferencesUpdate={setUserPreferences}
                  />
                } 
              />
              <Route 
                path="/journal" 
                element={
                  <Journal />
                } 
              />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </main>
        </div>
        
        {showLoginModal && (
          <LoginModal 
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={() => {
              setShowLoginModal(false);
              loadUserPreferences();
            }}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
