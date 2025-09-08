import React, { useState, useEffect } from 'react';

const ModelSelector = () => {
  const [currentModel, setCurrentModel] = useState('gpt-4o-mini');
  const [availableModels, setAvailableModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCurrentModel();
  }, []);

  const fetchCurrentModel = async () => {
    try {
      const response = await fetch('/api/model/current');
      if (response.ok) {
        const data = await response.json();
        setCurrentModel(data.current_model);
        setAvailableModels(data.available_models);
      }
    } catch (error) {
      console.error('Error fetching current model:', error);
    }
  };

  const switchModel = async (newModel) => {
    if (newModel === currentModel) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/model/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: newModel })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentModel(data.current_model);
        // Clear cache when switching models for fresh results
        await fetch('/api/cache/clear', { method: 'POST' });
      }
    } catch (error) {
      console.error('Error switching model:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getModelInfo = (model) => {
    const modelInfo = {
      'gpt-4o-mini': { name: 'GPT-4o Mini', speed: 'Very Fast', cost: 'Low' },
      'gpt-4o': { name: 'GPT-4o', speed: 'Fastest', cost: 'High' },
      'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', speed: 'Medium', cost: 'Lowest' },
      'claude-haiku': { name: 'Claude Haiku', speed: 'Fastest', cost: 'Low' }
    };
    return modelInfo[model] || { name: model, speed: 'Unknown', cost: 'Unknown' };
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Model Selection</h3>
      <div className="space-y-3">
        {availableModels.map((model) => {
          const info = getModelInfo(model);
          const isCurrent = model === currentModel;
          
          return (
            <div
              key={model}
              className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                isCurrent
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => switchModel(model)}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{info.name}</span>
                  {isCurrent && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Current
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <span>Speed: {info.speed}</span>
                  <span>Cost: {info.cost}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isLoading && isCurrent && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
                <button
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={isLoading}
                >
                  {isCurrent ? 'Active' : 'Select'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Speed Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Claude Haiku</strong>: Fastest overall, great for analysis</li>
          <li>• <strong>GPT-4o-mini</strong>: Very fast, cost-effective (current default)</li>
          <li>• <strong>GPT-4o</strong>: Fastest OpenAI model but expensive</li>
          <li>• <strong>GPT-3.5-turbo</strong>: Slower but cheapest</li>
        </ul>
      </div>
    </div>
  );
};

export default ModelSelector;


