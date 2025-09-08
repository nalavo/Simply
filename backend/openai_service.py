import os
import json
import time

class OpenAIService:
    def __init__(self):
        self.anthropic_key = os.environ.get('ANTHROPIC_API_KEY', None)
        self.last_request_time = 0
        self.min_request_interval = 0.2  # 200ms between requests for faster processing
        self.analysis_cache = {}  # Simple in-memory cache for analysis results
        self.preferred_model = 'claude-haiku'  # Force Claude Haiku only
        
        # Print startup message
        if self.anthropic_key:
            print(f"🚀 Claude Haiku initialized - Fastest analysis model")
        else:
            print("⚠️  Claude Haiku API key not configured - analysis will fail")
        
    def _rate_limit(self):
        """Ensure we don't exceed rate limits"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.min_request_interval:
            time.sleep(self.min_request_interval - time_since_last)
        self.last_request_time = time.time()
    
    def simplify_article(self, article, reading_level='5th_grade'):
        """Simplify an article using OpenAI"""
        try:
            # Claude Haiku only - no validation needed
            
            # Check cache first
            cache_key = f"{article.get('url', article.get('id', ''))}_{reading_level}"
            if cache_key in self.analysis_cache:
                print(f"Cache hit for article: {cache_key}")
                return self.analysis_cache[cache_key]
            
            self._rate_limit()
            
            # Track token usage for cost monitoring
            start_time = time.time()
            
            # Prepare the content for simplification
            title = article.get('title', '')
            description = article.get('description', '')
            content = article.get('content', '')
            
            # Combine title and description for better context
            full_content = f"Title: {title}\n\nDescription: {description}"
            if content:
                full_content += f"\n\nContent: {content}"
            
            # Define reading level instructions
            reading_instructions = {
                '3rd_grade': 'Rewrite this news article at a 3rd grade reading level. Use simple words, short sentences, and explain any complex terms.',
                '5th_grade': 'Rewrite this news article at a 5th grade reading level. Use clear language, avoid jargon, and explain important concepts.',
                '8th_grade': 'Rewrite this news article at an 8th grade reading level. Use accessible language while maintaining the key information.',
                'adult': 'Rewrite this news article in clear, concise language suitable for adults. Maintain accuracy and key details.'
            }
            
            instruction = reading_instructions.get(reading_level, reading_instructions['5th_grade'])
            
            # Create the prompt
            prompt = f"""
{instruction}

Analyze this news article and provide the following in valid JSON format only:

Article: {full_content}

CRITICAL: You must respond with ONLY valid JSON. No explanations, no markdown, no extra text.

Required JSON format (copy this exactly and fill in the values):
{{
    "full_content": "comprehensive summary or full article content",
    "pros": ["positive aspect 1", "positive aspect 2", "positive aspect 3"],
    "cons": ["concern 1", "concern 2", "concern 3"],
    "simplified_summary": "summary in 1-2 sentences",
    "reading_level": "{reading_level}",
    "original_title": "{title}",
    "original_source": "{article.get('source', '')}",
    "original_url": "{article.get('url', '')}",
    "original_image": "{article.get('urlToImage', '')}",
    "published_at": "{article.get('publishedAt', '')}"
}}

RULES:
1. Respond with ONLY the JSON object above
2. Ensure all strings are properly quoted and escaped
3. Provide exactly 3 pros and 3 cons
4. Keep content concise but informative
5. Double-check that your JSON is valid before responding
6. Use the exact format above - do not modify the structure
"""
            
            # Use Claude Haiku (fastest model)
            if not self.anthropic_key:
                raise Exception("Claude Haiku API key not configured. Please set ANTHROPIC_API_KEY in your environment.")
            
            try:
                import anthropic
                print(f"Using Anthropic version: {anthropic.__version__}")
                
                # Initialize client with proper error handling
                client = anthropic.Anthropic(
                    api_key=self.anthropic_key,
                )
                
                # Create the message with proper formatting
                response = client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=500,
                    temperature=0.1,
                    system="You are a helpful assistant that simplifies news articles for different reading levels while maintaining accuracy and key information. You MUST respond with valid JSON only.",
                    messages=[{"role": "user", "content": prompt}]
                )
                
                response_text = response.content[0].text.strip()
                print(f"Claude Haiku response received: {len(response_text)} characters")
                
            except Exception as e:
                print(f"Error with Claude Haiku API: {str(e)}")
                print(f"Error type: {type(e)}")
                import traceback
                traceback.print_exc()
                raise e
            
            # Response text is already parsed above
            
            # Clean up markdown formatting if present
            if response_text.startswith('```json'):
                response_text = response_text.replace('```json', '').replace('```', '').strip()
            elif response_text.startswith('```'):
                response_text = response_text.replace('```', '').strip()
            
            # Log usage for cost monitoring (Claude Haiku only)
            input_tokens = len(prompt.split()) * 1.3  # Approximate token count
            output_tokens = len(response_text.split()) * 1.3
            input_cost = (input_tokens / 1000000) * 0.25  # $0.25 per 1M tokens
            output_cost = (output_tokens / 1000000) * 1.25  # $1.25 per 1M tokens
            total_cost = input_cost + output_cost
            print(f"🚀 Claude Haiku: ~{int(input_tokens)} input tokens, ~{int(output_tokens)} output tokens, ${total_cost:.4f} cost")
            
            try:
                # Try to parse as JSON
                simplified_data = json.loads(response_text)
                
                # Validate required fields
                required_fields = ['full_content', 'pros', 'cons', 'simplified_summary', 'reading_level']
                for field in required_fields:
                    if field not in simplified_data:
                        raise Exception(f"Missing required field: {field}")
                
                # Validate pros and cons are lists with exactly 3 items
                if not isinstance(simplified_data['pros'], list) or len(simplified_data['pros']) != 3:
                    raise Exception("Pros must be a list with exactly 3 items")
                if not isinstance(simplified_data['cons'], list) or len(simplified_data['cons']) != 3:
                    raise Exception("Cons must be a list with exactly 3 items")
                
                # Cache the result for future use
                self.analysis_cache[cache_key] = simplified_data
                
                return simplified_data
            except json.JSONDecodeError as e:
                # Try to repair common JSON issues
                print(f"JSON Parse Error: {str(e)}")
                print(f"Attempting to repair malformed JSON...")
                
                # Try to fix common issues
                repaired_text = response_text
                
                # Fix unterminated strings by finding the last complete quote
                if '"full_content"' in repaired_text:
                    # Find the start of full_content
                    start_idx = repaired_text.find('"full_content"')
                    if start_idx != -1:
                        # Find the next quote after the value
                        quote_start = repaired_text.find('"', start_idx + 15)
                        if quote_start != -1:
                            # Find the next quote to close the string
                            quote_end = repaired_text.find('"', quote_start + 1)
                            if quote_end == -1:
                                # String is unterminated, close it
                                repaired_text = repaired_text + '"'
                
                # Try to parse the repaired JSON
                try:
                    simplified_data = json.loads(repaired_text)
                    print("JSON repair successful!")
                    
                    # Validate and return
                    required_fields = ['full_content', 'pros', 'cons', 'simplified_summary', 'reading_level']
                    for field in required_fields:
                        if field not in simplified_data:
                            raise Exception(f"Missing required field: {field}")
                    
                    # Cache the result for future use
                    self.analysis_cache[cache_key] = simplified_data
                    return simplified_data
                    
                except:
                    print("JSON repair failed")
                    print(f"Original response: {response_text[:500]}...")
                    raise Exception("Failed to parse Claude Haiku response as JSON")
                    
            except Exception as e:
                print(f"Validation Error: {str(e)}")
                print(f"Response text: {response_text[:500]}...")
                raise Exception(f"Invalid response format: {str(e)}")
                
        except Exception as e:
            print(f"Error simplifying article: {str(e)}")
            # Re-raise the exception instead of returning fallback
            raise e
    
    def batch_simplify_articles(self, articles, reading_level='5th_grade'):
        """Simplify multiple articles in batch"""
        simplified_articles = []
        
        for article in articles:
            simplified = self.simplify_article(article, reading_level)
            simplified_articles.append(simplified)
            
            # Add small delay between requests
            time.sleep(0.1)
        
        return simplified_articles
    
    def clear_cache(self):
        """Clear the analysis cache"""
        self.analysis_cache.clear()
        print("Analysis cache cleared") 