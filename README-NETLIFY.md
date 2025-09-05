# SemantleKo - Korean Word Similarity Game

Korean version of Semantle - a word guessing game based on semantic similarity.

## 🎯 Game Features

- **Korean Word Similarity**: Uses FastText Korean word embeddings
- **Real-time Multiplayer**: WebSocket-based multiplayer support
- **Enhanced Scoring**: Improved scoring system matching English Semantle
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## 🚀 Deployment

### Netlify Deployment

1. **Connect to GitHub**: Link your Netlify account to this repository
2. **Build Settings**:
   - Build command: `npm run build:client`
   - Publish directory: `client/dist`
3. **Environment Variables** (add in Netlify dashboard):
   ```
   NODE_ENV=production
   ENABLE_FASTTEXT=false
   SESSION_SECRET=your_session_secret_here
   ```

### Local Development

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Setup FastText Model** (for full functionality):

   ```bash
   npm run setup:fasttext
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express
- **Database**: PostgreSQL with Drizzle ORM
- **Word Embeddings**: FastText Korean (cc.ko.300.vec)
- **Real-time**: WebSocket for multiplayer

## 📦 Technical Details

### File Structure

```
├── client/               # React frontend
├── server/              # Express backend
├── shared/              # Shared types/schemas
├── data/               # Word data and FastText models
├── netlify/            # Netlify Functions
└── scripts/            # Setup scripts
```

### Key Components

- **DirectFastText**: On-demand vector loading for memory efficiency
- **GameEngine**: Core game logic and scoring
- **Word2Vec Service**: Similarity calculations
- **WebSocket Handler**: Real-time multiplayer communication

### Scoring System

Enhanced scoring formula: `Math.min(100, Math.max(0, (cosineSimilarity + 0.15) * 120))`

This provides better score ranges (30-80 points) matching English Semantle gameplay.

## 🔧 Configuration

### Environment Variables

- `NODE_ENV`: Environment mode (development/production)
- `ENABLE_FASTTEXT`: Enable FastText embeddings (false for Netlify)
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `CORS_ORIGIN`: Allowed CORS origins

### Production Notes

- FastText file (4.21GB) is excluded from Git due to GitHub's 100MB limit
- Netlify deployment uses fallback similarity data
- For full functionality with FastText, consider using services like Railway or Heroku

## 📊 Game Data

- **Korean Words**: 1000+ frequent Korean words
- **Similarity Pairs**: Pre-calculated similarity scores
- **Target Words**: 19+ Korean target words for gameplay

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Submit a pull request

## 📝 License

MIT License - feel free to use and modify!
