# Simply – The News, Made Simple

Simply is a full-stack web application that fetches live news articles from NewsAPI.org, uses AI to analyze and simplify content, and displays articles in a clean, modern interface with intelligent categorization.

## Features

### For All Users
- **Smart News Analysis**: AI-powered content analysis with pros/cons breakdown
- **Dual View Modes**: Toggle between card (grid) and row (list) layouts
- **Intelligent Categories**: Auto-detected categories (General, Business, Technology, Entertainment, Health, Science, Sports, Politics)
- **Quality Filtering**: Only shows articles with complete data (title, description, image, source)
- **Responsive Design**: Beautiful, modern UI built with Tailwind CSS
- **Real-time Content**: Fresh news articles updated regularly
- **No Placeholders**: Only real images - no "No Image Available" messages

### For Authenticated Users
- **Personalization**: Set preferred reading level, topics, and default view mode
- **Favorites**: Save and manage favorite articles
- **User Preferences**: Customize your reading experience with persistent settings
- **Firebase Authentication**: Secure sign-in with email/password or Google
- **Journal Entries**: Add personal notes and insights about articles

## Tech Stack

### Backend
- **Flask**: Python web framework
- **Firebase Admin**: Authentication and Firestore database
- **OpenAI API**: Content simplification
- **NewsAPI.org**: News article fetching
- **Redis**: Caching for performance
- **CORS**: Cross-origin resource sharing

### Frontend
- **React**: Modern JavaScript framework
- **Firebase**: Authentication and real-time database
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icons
- **React Router**: Client-side routing

## Prerequisites

Before running this application, you'll need:

1. **Python 3.8+** and **Node.js 16+**
2. **Firebase** project with Authentication and Firestore enabled (optional for basic functionality)
3. **NewsAPI.org** API key (required)
4. **OpenAI API** key (optional - for AI analysis features)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd simply_starter
```

### 2. Install Dependencies

```bash
# Backend dependencies
pip install -r requirements.txt

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Required: NewsAPI.org API key
NEWS_API_KEY=your_news_api_key_here

# Optional: OpenAI API key for AI analysis
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Firebase configuration (for user features)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

### 4. Get API Keys

1. **NewsAPI.org** (Required):
   - Sign up at [NewsAPI.org](https://newsapi.org/)
   - Get your free API key
   - Add it to your `.env` file

2. **OpenAI** (Optional):
   - Sign up at [OpenAI](https://openai.com/)
   - Get your API key for AI analysis features
   - Add it to your `.env` file

### 5. Run the Application

```bash
# Terminal 1: Start the backend server
python test_simple.py

# Terminal 2: Start the frontend (in a new terminal)
cd frontend
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5004

## Advanced Setup (Optional)

### Firebase Integration (for user features)

If you want to enable user authentication and favorites:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Google providers)
3. Enable Firestore database
4. Download your Firebase service account key and save it as `firebase-credentials.json` in the `backend` directory
5. Create a `.env` file in the `frontend` directory:

```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### Using the Full Backend (instead of test server)

```bash
# Start the full backend with all features
cd backend
python app.py
```

Update the frontend proxy in `frontend/package.json`:
```json
{
  "proxy": "http://localhost:5000"
}
```

## Project Structure

```
simply_starter/
├── backend/
│   ├── app.py                    # Main Flask application (full features)
│   ├── news_api.py               # NewsAPI.org integration
│   ├── openai_service.py         # OpenAI content simplification
│   ├── firebase-credentials.json # Firebase service account
│   └── Procfile                  # Heroku deployment config
├── frontend/
│   ├── public/
│   │   ├── index.html           # Main HTML file
│   │   ├── manifest.json        # PWA manifest
│   │   └── simply-logo*.jpg     # App logos
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Header.js        # Navigation and search
│   │   │   ├── NewsFeed.js      # Article display
│   │   │   ├── NewsCard.js      # Individual article cards
│   │   │   ├── LoginModal.js    # User authentication
│   │   │   └── ...              # Other components
│   │   ├── App.js               # Main React app
│   │   ├── firebase.js          # Firebase configuration
│   │   ├── index.js             # React entry point
│   │   └── index.css            # Global styles
│   ├── package.json             # Frontend dependencies
│   └── tailwind.config.js       # Tailwind configuration
├── test_simple.py               # Simplified test server
├── requirements.txt             # Python dependencies
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## Troubleshooting

### Common Issues

1. **"Failed to fetch articles" error**:
   - Check if your NewsAPI key is correct
   - Ensure the backend server is running on port 5004
   - Verify your internet connection

2. **No articles showing**:
   - Check the browser console for errors
   - Verify the NewsAPI key is valid
   - Try a different category

3. **Images not loading**:
   - The app only shows articles with real images
   - This is intentional - no placeholder images are used

4. **Backend server won't start**:
   - Check if port 5004 is available
   - Install missing Python dependencies: `pip install -r requirements.txt`
   - Check for syntax errors in the code

5. **Frontend won't start**:
   - Install missing Node dependencies: `cd frontend && npm install`
   - Check if port 3000 is available
   - Clear npm cache: `npm cache clean --force`

### Getting Help

If you encounter issues:
1. Check the terminal/console for error messages
2. Ensure all dependencies are installed
3. Verify your API keys are correct
4. Check that ports 3000 and 5004 are available

## API Endpoints

### News
- `GET /api/news` - Fetch simplified news articles
- Query parameters: `category`, `page`, `page_size`, `reading_level`

### User Preferences
- `GET /api/user/preferences` - Get user preferences
- `PUT /api/user/preferences` - Update user preferences

### Favorites
- `GET /api/user/favorites` - Get user's favorite articles
- `POST /api/user/favorites` - Add article to favorites
- `DELETE /api/user/favorites/<article_id>` - Remove article from favorites

## Deployment

### Backend Deployment (Heroku)

1. Create a `Procfile` in the backend directory:
```
web: gunicorn app:app
```

2. Set environment variables in Heroku:
```bash
heroku config:set NEWS_API_KEY=your_key
heroku config:set OPENAI_API_KEY=your_key
heroku config:set SECRET_KEY=your_secret
```

3. Deploy to Heroku:
```bash
git subtree push --prefix backend heroku main
```

### Frontend Deployment (Netlify/Vercel)

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Deploy the `build` folder to your preferred hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

