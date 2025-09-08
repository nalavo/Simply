import React, { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import ModelSelector from './ModelSelector';

const UserPreferences = ({ user, preferences, onPreferencesUpdate }) => {
  const [formData, setFormData] = useState({
    preferred_topics: ['general'],
    default_view: 'card'
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
    }
  }, [preferences]);

  const topics = [
    { value: 'general', label: 'Top Stories' },
    { value: 'business', label: 'Business' },
    { value: 'technology', label: 'Technology' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'health', label: 'Health' },
    { value: 'science', label: 'Science' },
    { value: 'sports', label: 'Sports' },
    { value: 'politics', label: 'Politics' }
  ];

  const viewModes = [
    { value: 'card', label: 'Card View', description: 'Large cards with images' },
    { value: 'row', label: 'Row View', description: 'Compact list format' }
  ];

  const handleTopicToggle = (topic) => {
    setFormData(prev => ({
      ...prev,
      preferred_topics: prev.preferred_topics.includes(topic)
        ? prev.preferred_topics.filter(t => t !== topic)
        : [...prev.preferred_topics, topic]
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onPreferencesUpdate(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="news-feed">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">User Preferences</h1>
            <p className="text-gray-600">Please sign in to customize your reading experience.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-feed">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Preferences</h1>
          <p className="text-gray-600">Customize your Simply experience</p>
        </div>

        <div className="space-y-8">
          {/* AI Model Selection */}
          <ModelSelector />
          
          {/* Preferred Topics */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferred Topics</h2>
            <p className="text-gray-600 mb-4">Select the topics you're most interested in reading about.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {topics.map((topic) => (
                <label
                  key={topic.value}
                  className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.preferred_topics.includes(topic.value)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.preferred_topics.includes(topic.value)}
                    onChange={() => handleTopicToggle(topic.value)}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-900">{topic.label}</span>
                  {formData.preferred_topics.includes(topic.value) && (
                    <Check className="w-4 h-4 text-primary-600 ml-auto" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Default View Mode */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Default View Mode</h2>
            <p className="text-gray-600 mb-4">Choose your preferred way to view articles.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {viewModes.map((mode) => (
                <label
                  key={mode.value}
                  className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.default_view === mode.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="default_view"
                    value={mode.value}
                    checked={formData.default_view === mode.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_view: e.target.value }))}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{mode.label}</div>
                    <div className="text-sm text-gray-600">{mode.description}</div>
                  </div>
                  {formData.default_view === mode.value && (
                    <Check className="w-5 h-5 text-primary-600" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences; 