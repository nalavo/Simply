import React, { useState, useEffect } from 'react';
import { ExternalLink, Edit3, Trash2, Calendar, User, Clock } from 'lucide-react';

const Journal = () => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    loadJournalEntries();
  }, []);

  const loadJournalEntries = () => {
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    // Sort by timestamp (newest first)
    const sortedEntries = entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setJournalEntries(sortedEntries);
  };

  const deleteEntry = (entryId) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      const updatedEntries = journalEntries.filter(entry => entry.id !== entryId);
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      setJournalEntries(updatedEntries);
    }
  };

  const startEditing = (entry) => {
    setEditingEntry(entry);
    setEditNotes(entry.notes);
  };

  const saveEdit = () => {
    if (!editingEntry) return;
    
    const updatedEntries = journalEntries.map(entry => 
      entry.id === editingEntry.id 
        ? { ...entry, notes: editNotes, timestamp: new Date().toISOString() }
        : entry
    );
    
    localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
    setJournalEntries(updatedEntries);
    setEditingEntry(null);
    setEditNotes('');
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setEditNotes('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupEntriesByDate = () => {
    const groups = {};
    journalEntries.forEach(entry => {
      const date = new Date(entry.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });
    return groups;
  };

  const groupedEntries = groupEntriesByDate();

  if (journalEntries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No journal entries yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start reading articles and add your thoughts to the journal to see them here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            My Journal
          </h1>
          <p className="mt-2 text-gray-600">
            Your personal collection of thoughts and insights from the articles you've read.
          </p>
        </div>

        {/* Journal Entries */}
        <div className="space-y-8">
          {Object.entries(groupedEntries).map(([date, entries]) => (
            <div key={date} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Date Header */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-gray-500" />
                  {formatDate(date)}
                </h2>
              </div>

              {/* Entries for this date */}
              <div className="divide-y divide-gray-200">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Article Image */}
                      {entry.image && (
                        <div className="flex-shrink-0">
                          <img
                            src={entry.image}
                            alt={entry.title}
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Article Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {entry.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{entry.source}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(entry.timestamp)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEditing(entry)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit notes"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Notes */}
                        {editingEntry?.id === entry.id ? (
                          <div className="mt-4">
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              placeholder="Write your thoughts..."
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                              <button
                                onClick={cancelEdit}
                                className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveEdit}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {entry.notes}
                            </p>
                          </div>
                        )}

                        {/* Article Link */}
                        {entry.url && (
                          <div className="mt-3">
                            <a
                              href={entry.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Read original article
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Journal Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{journalEntries.length}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
                          <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {new Set(journalEntries.map(e => new Date(e.timestamp).toDateString())).size}
                </div>
                <div className="text-sm text-gray-600">Days Active</div>
              </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(journalEntries.map(e => e.source)).size}
              </div>
              <div className="text-sm text-gray-600">Sources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(journalEntries.reduce((total, e) => total + (e.notes?.length || 0), 0) / 100) / 10}
              </div>
              <div className="text-sm text-gray-600">Avg Notes Length</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;
