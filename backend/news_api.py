# Handles fetching articles from News API

import requests
import os
from datetime import datetime, timedelta
import time

class NewsAPI:
    def __init__(self):
        self.api_key = os.environ.get('NEWS_API_KEY', '')
        self.base_url = 'https://newsapi.org/v2'
        self.last_request_time = 0
        self.min_request_interval = 0.1  # 100ms between requests
        
    def _rate_limit(self):
        """Ensure we don't exceed rate limits"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.min_request_interval:
            time.sleep(self.min_request_interval - time_since_last)
        self.last_request_time = time.time()
    
    def _detect_category(self, title, description, content):
        """Intelligently detect the category based on article content"""
        # Combine all text for analysis
        text = f"{title or ''} {description or ''} {content or ''}".lower()
        
        # Define category keywords
        category_keywords = {
            'business': ['business', 'economy', 'market', 'stock', 'finance', 'investment', 'company', 'corporate', 'trade', 'economic', 'financial', 'wall street', 'nasdaq', 's&p', 'earnings', 'revenue', 'profit', 'ceo', 'cfo', 'startup', 'venture capital'],
            'technology': ['technology', 'tech', 'software', 'ai', 'artificial intelligence', 'machine learning', 'blockchain', 'cryptocurrency', 'bitcoin', 'ethereum', 'startup', 'app', 'mobile', 'internet', 'cybersecurity', 'data', 'cloud', 'google', 'apple', 'microsoft', 'facebook', 'amazon', 'tesla', 'spacex', 'robotics', 'automation'],
            'entertainment': ['entertainment', 'movie', 'film', 'tv', 'television', 'show', 'actor', 'actress', 'celebrity', 'hollywood', 'music', 'song', 'album', 'artist', 'singer', 'rapper', 'concert', 'award', 'oscar', 'grammy', 'netflix', 'disney', 'marvel', 'star wars', 'game of thrones', 'reality tv', 'comedy'],
            'health': ['health', 'medical', 'medicine', 'doctor', 'hospital', 'patient', 'disease', 'cancer', 'covid', 'coronavirus', 'vaccine', 'treatment', 'therapy', 'surgery', 'pharmaceutical', 'drug', 'mental health', 'psychology', 'wellness', 'fitness', 'nutrition', 'diet', 'exercise', 'gym', 'workout'],
            'science': ['science', 'research', 'study', 'scientist', 'laboratory', 'experiment', 'discovery', 'innovation', 'physics', 'chemistry', 'biology', 'astronomy', 'space', 'nasa', 'mars', 'moon', 'planet', 'galaxy', 'universe', 'climate', 'environment', 'ecology', 'evolution', 'genetics', 'dna'],
            'sports': ['sports', 'football', 'basketball', 'baseball', 'soccer', 'tennis', 'golf', 'olympics', 'nfl', 'nba', 'mlb', 'nhl', 'championship', 'tournament', 'game', 'match', 'player', 'team', 'coach', 'athlete', 'champion', 'victory', 'defeat', 'score', 'league', 'season'],
            'politics': ['politics', 'political', 'government', 'election', 'vote', 'democrat', 'republican', 'congress', 'senate', 'house', 'president', 'senator', 'representative', 'policy', 'law', 'legislation', 'bill', 'act', 'administration', 'federal', 'state', 'local', 'campaign', 'poll', 'polling', 'democracy', 'republic']
        }
        
        # Score each category based on keyword matches
        category_scores = {}
        for category, keywords in category_keywords.items():
            score = 0
            for keyword in keywords:
                if keyword in text:
                    score += 1
            category_scores[category] = score
        
        # Find the category with the highest score
        best_category = max(category_scores, key=category_scores.get)
        
        # Only return the detected category if it has a reasonable score
        if category_scores[best_category] >= 1:
            return best_category
        else:
            return 'general'  # Default to general if no clear category detected
    
    def get_articles(self, category='general', page=1, page_size=30, country='us', search_query='', sort_by='publishedAt'):
        """Fetch articles from NewsAPI with intelligent category filtering"""
        try:
            self._rate_limit()
            
            # Fetch more articles initially to account for filtering (respecting NewsAPI limits)
            fetch_size = min(max(page_size * 3, 100), 100)  # Max 100 due to API limits
            
            params = {
                'apiKey': self.api_key,
                'q': self._get_category_query(category),
                'pageSize': fetch_size,
                'page': page,
                'language': 'en',
                'sortBy': sort_by,
                'from': (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'),
                'to': datetime.now().strftime('%Y-%m-%d')
            }
            
            url = f"{self.base_url}/everything"
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                articles = data.get('articles', [])
                
                # Process and filter articles by detected category
                processed_articles = []
                category_matches = []
                other_articles = []
                
                print(f"DEBUG: Processing {len(articles)} articles from NewsAPI")
                
                for i, article in enumerate(articles):
                    print(f"DEBUG: Article {i+1}: title='{article.get('title', 'None')}', description='{article.get('description', 'None')}'")
                    # Filter out foreign language articles (keep only English)
                    title = article.get('title', '') or ''
                    description = article.get('description', '') or ''
                    
                    # Check if article is in English (simple heuristic) - completely disabled for debugging
                    # if not self._is_english(title + ' ' + description):
                    #     continue
                    
                    # Detect the actual category based on content
                    detected_category = self._detect_category(
                        title,
                        description,
                        article.get('content', '')
                    )
                    
                    processed_article = {
                        'title': title,
                        'description': description,
                        'content': article.get('content', ''),
                        'url': article.get('url', ''),
                        'urlToImage': article.get('urlToImage', ''),
                        'publishedAt': article.get('publishedAt', ''),
                        'source': article.get('source', {}).get('name', ''),
                        'author': article.get('author', ''),
                        'category': detected_category,
                        'videoUrl': article.get('videoUrl', None)
                    }
                    
                    if processed_article['title']:
                        # For general category, treat all articles as potential matches
                        if category == 'general':
                            # When requesting general category, all articles are potential matches
                            category_matches.append(processed_article)
                        elif detected_category == category:
                            category_matches.append(processed_article)
                        else:
                            other_articles.append(processed_article)
                
                print(f"DEBUG: Category matches: {len(category_matches)}, Other articles: {len(other_articles)}")
                print(f"DEBUG: First few category matches: {[a.get('title', 'No title') for a in category_matches[:3]]}")
                
                                # For general category, be much more inclusive
                if category == 'general':
                    # For general category, include ALL articles with titles (very broad)
                    all_articles = category_matches + other_articles
                    
                    # For general category, we want to return ALL articles up to page_size
                    # regardless of their detected category
                    result = []
                    seen_urls = set()
                    
                    # Take all articles that have titles and URLs, up to page_size
                    for article in all_articles:
                        if len(result) >= page_size:
                            break
                        if article.get('title') and article.get('url') and article.get('url') not in seen_urls:
                            result.append(article)
                            seen_urls.add(article.get('url'))
                    
                    # If we still don't have enough, just take any articles with titles
                    if len(result) < page_size:
                        for article in all_articles:
                            if len(result) >= page_size:
                                break
                            if article.get('title') and article not in result:
                                result.append(article)
                    
                    print(f"DEBUG: General category - processed {len(all_articles)} articles, returning {len(result)} articles")
                else:
                    # For other categories, use the existing logic
                    result = category_matches[:page_size]
                    
                    # If we don't have enough exact matches, add some relevant articles
                    if len(result) < page_size and other_articles:
                        remaining = page_size - len(result)
                        # Take articles that might be relevant even if not exact category match
                        result.extend(other_articles[:remaining])
                    
                    # Always try to return more articles if available (up to 2x page_size)
                    max_articles = page_size * 2
                    if len(result) < max_articles and other_articles:
                        additional = min(max_articles - len(result), len(other_articles))
                        result.extend(other_articles[:additional])
                
                # If we still don't have enough, be less strict about category matching (for non-general categories)
                if category != 'general' and len(result) < page_size:
                    # Include articles that are somewhat related to the category
                    for article in other_articles:
                        if len(result) >= page_size:
                            break
                        # Check if article has any relevance to the category
                        if self._is_somewhat_relevant(article, category):
                            result.append(article)
                
                # If still not enough, try to fetch more with broader search
                if len(result) < page_size:
                    # Try a broader search for this category
                    broader_params = params.copy()
                    broader_params['q'] = self._get_broader_query(category)
                    broader_params['pageSize'] = min(100, page_size * 2)
                    broader_params['from'] = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
                    broader_params['to'] = datetime.now().strftime('%Y-%m-%d')
                    
                    broader_response = requests.get(url, params=broader_params, timeout=10)
                    if broader_response.status_code == 200:
                        broader_data = broader_response.json()
                        broader_articles = broader_data.get('articles', [])
                        
                        for article in broader_articles:
                            if len(result) >= page_size:
                                break
                                
                            processed_article = {
                                'title': article.get('title', ''),
                                'description': article.get('description', ''),
                                'content': article.get('content', ''),
                                'url': article.get('url', ''),
                                'urlToImage': article.get('urlToImage', ''),
                                'publishedAt': article.get('publishedAt', ''),
                                'source': article.get('source', {}).get('name', ''),
                                'author': article.get('author', ''),
                                'category': category,  # Use requested category for broader results
                                'videoUrl': article.get('videoUrl', None)
                            }
                            
                            if processed_article['title'] and processed_article not in result:
                                result.append(processed_article)
                
                return result
            else:
                print(f"NewsAPI error: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"Error fetching news: {str(e)}")
            return []
    
    def _is_english(self, text):
        """Check if text is in English (simple heuristic)"""
        if not text:
            return False
        
        # Check for non-Latin characters (Chinese, Japanese, Korean, Arabic, etc.)
        non_latin_chars = 0
        for char in text:
            if ord(char) > 127:  # Non-ASCII characters
                non_latin_chars += 1
        
        # If more than 20% of characters are non-Latin, it's likely foreign language
        if non_latin_chars > len(text) * 0.2:
            return False
        
        # Common English words and patterns
        english_indicators = [
            'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
            'news', 'report', 'announcement', 'update', 'breaking', 'latest', 'today',
            'said', 'announced', 'reported', 'confirmed', 'revealed', 'launched'
        ]
        
        # Count English words in the text
        text_lower = text.lower()
        english_word_count = sum(1 for word in english_indicators if word in text_lower)
        
        # If we find several English words, it's likely English
        return english_word_count >= 3
    
    def _is_somewhat_relevant(self, article, category):
        """Check if an article is somewhat relevant to a category (less strict than exact match)"""
        text = f"{article.get('title', '') or ''} {article.get('description', '') or ''}".lower()
        
        # Define broader relevance keywords for each category
        relevance_keywords = {
            'general': ['news', 'latest', 'breaking', 'update', 'report', 'announcement', 'world', 'national', 'international', 'headline', 'story', 'event'],
            'business': ['business', 'economy', 'market', 'finance', 'company', 'corporate', 'trade', 'economic', 'financial', 'investment', 'stock', 'ceo', 'startup'],
            'technology': ['technology', 'tech', 'digital', 'software', 'computer', 'internet', 'ai', 'artificial intelligence', 'innovation', 'startup', 'app', 'mobile'],
            'entertainment': ['entertainment', 'media', 'culture', 'arts', 'celebrity', 'show', 'performance', 'movie', 'music', 'tv', 'film'],
            'health': ['health', 'wellness', 'medical', 'fitness', 'nutrition', 'lifestyle', 'medicine', 'doctor', 'hospital', 'treatment'],
            'science': ['science', 'research', 'discovery', 'innovation', 'study', 'experiment', 'laboratory', 'scientist'],
            'sports': ['sports', 'athletics', 'competition', 'game', 'match', 'tournament', 'player', 'team', 'champion'],
            'politics': ['politics', 'government', 'policy', 'law', 'democracy', 'society', 'election', 'congress', 'senate', 'president']
        }
        
        keywords = relevance_keywords.get(category, [])
        relevance_score = sum(1 for keyword in keywords if keyword in text)
        
        # Return true if article has at least some relevance
        return relevance_score >= 1

    def _get_broader_query(self, category):
        """Get broader search query terms for each category when we need more articles"""
        broader_queries = {
            'general': 'news OR current OR latest OR breaking OR world OR national OR international OR headline OR update OR report',
            'business': 'business OR economy OR market OR finance OR corporate OR trade OR economic',
            'technology': 'technology OR tech OR digital OR innovation OR software OR internet OR computer',
            'entertainment': 'entertainment OR media OR culture OR arts OR celebrity OR show OR performance',
            'health': 'health OR wellness OR medical OR fitness OR nutrition OR lifestyle',
            'science': 'science OR research OR discovery OR innovation OR study OR experiment',
            'sports': 'sports OR athletics OR competition OR game OR match OR tournament',
            'politics': 'politics OR government OR policy OR law OR democracy OR society'
        }
        return broader_queries.get(category, 'news')

    def _get_category_query(self, category):
        """Get search query terms for each category"""
        category_queries = {
            'general': 'news OR breaking OR latest OR current OR world OR national OR international OR headline',
            'business': 'business OR economy OR market OR finance OR stock OR investment',
            'technology': 'technology OR tech OR software OR AI OR artificial intelligence OR startup',
            'entertainment': 'entertainment OR movie OR film OR TV OR music OR celebrity OR hollywood',
            'health': 'health OR medical OR medicine OR healthcare OR wellness',
            'science': 'science OR research OR discovery OR innovation OR study',
            'sports': 'sports OR football OR basketball OR baseball OR soccer OR athletics',
            'politics': 'politics OR government OR election OR congress OR senate OR president'
        }
        return category_queries.get(category, 'news')
    
    def search_articles(self, query, page=1, page_size=30, sort_by='publishedAt'):
        """Search for articles by keyword"""
        try:
            self._rate_limit()
            
            params = {
                'apiKey': self.api_key,
                'q': query,
                'pageSize': page_size,
                'page': page,
                'language': 'en',
                'sortBy': sort_by
            }
            
            url = f"{self.base_url}/everything"
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                articles = data.get('articles', [])
                
                processed_articles = []
                for article in articles:
                    processed_article = {
                        'title': article.get('title', ''),
                        'description': article.get('description', ''),
                        'content': article.get('content', ''),
                        'url': article.get('url', ''),
                        'urlToImage': article.get('urlToImage', ''),
                        'publishedAt': article.get('publishedAt', ''),
                        'source': article.get('source', {}).get('name', ''),
                        'author': article.get('author', ''),
                        'category': 'search',
                        'videoUrl': article.get('videoUrl', None)  # Support for video URLs
                    }
                    
                    if processed_article['title']:  # Temporarily removed image requirement for testing
                        processed_articles.append(processed_article)
                
                return processed_articles
            else:
                print(f"NewsAPI search error: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"Error searching news: {str(e)}")
            return []
    
    def get_categories(self):
        """Get available news categories"""
        return [
            'general',
            'business',
            'technology',
            'entertainment',
            'health',
            'science',
            'sports',
            'politics'
        ]