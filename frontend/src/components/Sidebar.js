import React from 'react';
import { Filter, TrendingUp, Briefcase, Monitor, Film, Heart, Activity, Trophy } from 'lucide-react';

const Sidebar = ({ selectedCategory, onCategoryChange, user, userPreferences }) => {
  const categories = [
    { id: 'general', name: 'Top Stories', icon: TrendingUp },
    { id: 'business', name: 'Business', icon: Briefcase },
    { id: 'technology', name: 'Technology', icon: Monitor },
    { id: 'entertainment', name: 'Entertainment', icon: Film },
    { id: 'health', name: 'Health', icon: Heart },
    { id: 'science', name: 'Science', icon: Activity },
    { id: 'sports', name: 'Sports', icon: Trophy },
  ];

  return (
    <div className="sidebar hidden lg:block">
      <div className="space-y-6">
        {/* Category Filters */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Categories
          </h3>
          <div className="space-y-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 ${isSelected ? 'text-primary-600' : 'text-gray-500'}`} />
                  <span className="font-medium">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Preferences (if logged in) */}
        {user && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Preferences</h3>
            
            {/* Preferred Topics */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Topics
              </label>
              <div className="flex flex-wrap gap-2">
                {userPreferences?.preferred_topics?.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {topic === 'general' ? 'Top Stories' : topic}
                  </span>
                )) || <span className="text-sm text-gray-500">No preferences set</span>}
              </div>
            </div>

            {/* Default View */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default View
              </label>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <span className="font-medium capitalize">
                  {userPreferences?.default_view || 'card'} view
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Your preferred article layout
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 