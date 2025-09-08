#!/bin/bash

echo "🚀 Setting up Simply - The News, Made Simple"
echo "=============================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo "⚠️  Redis is not running. Please start Redis first:"
    echo "   macOS: brew services start redis"
    echo "   Ubuntu: sudo systemctl start redis"
    echo "   Windows: Start Redis server"
fi

echo "📦 Installing backend dependencies..."
cd backend
pip install -r ../requirements.txt

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo "✅ Dependencies installed successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Create a Firebase project and download credentials"
echo "2. Get API keys from NewsAPI.org and OpenAI"
echo "3. Create .env files with your configuration"
echo "4. Run 'python app.py' in the backend directory"
echo "5. Run 'npm start' in the frontend directory"
echo ""
echo "📚 See README.md for detailed setup instructions" 