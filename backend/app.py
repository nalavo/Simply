# Flask backend main app

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json
import requests
# import openai  # Removed - using Claude Haiku only
from datetime import datetime, timedelta
import redis
import hashlib
from news_api import NewsAPI
from openai_service import OpenAIService

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Try to load from parent directory first, then current directory
    load_dotenv('../.env')  # Load from parent directory
    load_dotenv('.env')     # Load from current directory (fallback)
    print("Environment variables loaded from .env files")
except ImportError:
    print("python-dotenv not installed, using system environment variables")
    pass

# Simple in-memory cache fallback
class SimpleCache:
    def __init__(self):
        self.cache = {}
    
    def get(self, key):
        if key in self.cache:
            data, expiry = self.cache[key]
            if expiry > datetime.now().timestamp():
                return data
            else:
                del self.cache[key]
        return None
    
    def setex(self, key, seconds, value):
        expiry = datetime.now().timestamp() + seconds
        self.cache[key] = (value, expiry)

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')
CORS(app, origins=['http://localhost:3000', 'http://localhost:3001'], supports_credentials=True)

# Initialize Firebase
try:
    cred = credentials.Certificate('firebase-credentials.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase initialized successfully")
except Exception as e:
    print(f"Firebase initialization failed: {e}")
    print("Running in development mode without Firebase")
    # Create a mock db for development
    class MockFirestore:
        def collection(self, name):
            return MockCollection()
    
    class MockCollection:
        def document(self, doc_id):
            return MockDocument()
    
    class MockDocument:
        def get(self):
            return MockDocumentSnapshot()
        def set(self, data, merge=False):
            return None
        def update(self, data):
            return None
    
    class MockDocumentSnapshot:
        def exists(self):
            return False
        def to_dict(self):
            return {}
    
    db = MockFirestore()

# Initialize services
news_api = NewsAPI()
openai_service = OpenAIService()

# Redis for caching (fallback to in-memory cache if Redis unavailable)
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0)
    redis_client.ping()  # Test connection
except:
    print("Redis not available, using in-memory cache")
    redis_client = SimpleCache()

@app.route('/api/news', methods=['GET'])
def get_news():
    """Fetch news articles (raw, without OpenAI processing)"""
    try:
        # Get query parameters
        category = request.args.get('category', 'general')
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 30))
        search_query = request.args.get('q', '')
        sort_by = request.args.get('sortBy', 'publishedAt')
        
        # Check cache first
        cache_key = f"news:{category}:{page}:{page_size}:{search_query}:{sort_by}"
        cached_result = redis_client.get(cache_key)
        
        if cached_result:
            return jsonify(json.loads(cached_result))
        
        # Fetch raw news (no OpenAI processing)
        raw_articles = news_api.get_articles(
            category=category, 
            page=page, 
            page_size=page_size,
            search_query=search_query,
            sort_by=sort_by
        )
        
        # Return raw articles without OpenAI processing
        result = {
            'articles': raw_articles,
            'page': page,
            'total_pages': len(raw_articles) // page_size + 1
        }
        
        # Cache the result for 30 minutes
        redis_client.setex(cache_key, 1800, json.dumps(result))
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/preferences', methods=['GET'])
def get_user_preferences():
    """Get user preferences"""
    try:
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        user_doc = db.collection('users').document(user_id).get()
        if user_doc.exists:
            return jsonify(user_doc.to_dict())
        else:
            # Return default preferences
            return jsonify({
                'preferred_topics': ['general'],
                'default_view': 'card',
                'favorites': []
            })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/preferences', methods=['PUT'])
def update_user_preferences():
    """Update user preferences"""
    try:
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        db.collection('users').document(user_id).set(data, merge=True)
        
        return jsonify({'message': 'Preferences updated successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/favorites', methods=['GET'])
def get_favorites():
    """Get user's favorite articles"""
    try:
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        user_doc = db.collection('users').document(user_id).get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            return jsonify({'favorites': user_data.get('favorites', [])})
        else:
            return jsonify({'favorites': []})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/favorites', methods=['POST'])
def add_favorite():
    """Add article to favorites"""
    try:
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        article_data = request.json
        
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            favorites = user_data.get('favorites', [])
            
            # Check if article already exists
            article_exists = any(fav.get('url') == article_data.get('url') for fav in favorites)
            
            if not article_exists:
                favorites.append(article_data)
                user_ref.update({'favorites': favorites})
        
        return jsonify({'message': 'Article added to favorites'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/favorites/<article_id>', methods=['DELETE'])
def remove_favorite(article_id):
    """Remove article from favorites"""
    try:
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            favorites = user_data.get('favorites', [])
            
            # Remove article by URL
            favorites = [fav for fav in favorites if fav.get('url') != article_id]
            user_ref.update({'favorites': favorites})
        
        return jsonify({'message': 'Article removed from favorites'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_user_id_from_token():
    """Extract user ID from Firebase token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split('Bearer ')[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']
    except:
        return None

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/debug/news', methods=['GET'])
def debug_news():
    """Debug news endpoint"""
    try:
        # Test NewsAPI directly
        articles = news_api.get_articles(category='general', page=1, page_size=3)
        return jsonify({
            'status': 'success',
            'articles_count': len(articles),
            'articles': articles[:2] if articles else [],
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e), 'timestamp': datetime.now().isoformat()}), 500

@app.route('/api/cache/status', methods=['GET'])
def cache_status():
    """Get cache status and performance metrics"""
    try:
        cache_info = {
            'cache_size': len(openai_service.analysis_cache),
            'cache_keys': list(openai_service.analysis_cache.keys())[:10],  # Show first 10 keys
            'timestamp': datetime.now().isoformat()
        }
        return jsonify(cache_info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """Clear the analysis cache"""
    try:
        openai_service.clear_cache()
        return jsonify({'message': 'Cache cleared successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/model/current', methods=['GET'])
def get_current_model():
    """Get the currently selected AI model"""
    try:
        return jsonify({
            'current_model': 'claude-haiku',
            'available_models': ['claude-haiku'],
            'message': 'Claude Haiku is the only available model for fastest analysis'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/model/performance', methods=['GET'])
def get_model_performance():
    """Get performance metrics for Claude Haiku"""
    try:
        performance_data = {
            'claude-haiku': {
                'avg_response_time': '1-2s', 
                'cost_per_request': '$0.001-0.003', 
                'reliability': '99%',
                'description': 'Fastest AI model available for analysis'
            }
        }
        
        return jsonify({
            'current_model': 'claude-haiku',
            'performance': performance_data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/simplify', methods=['POST'])
def simplify_article_on_demand():
    """Simplify a single article on demand"""
    try:
        data = request.get_json()
        article = data.get('article')
        if not article:
            return jsonify({'error': 'Missing article data'}), 400
        # Use default reading level for all articles
        simplified = openai_service.simplify_article(article, '5th_grade')
        return jsonify(simplified)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5003)
