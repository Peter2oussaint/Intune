# 🎵 Intune - AI-Powered Harmonic Music Discovery Platform

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-orange.svg)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-Jest-red.svg)](https://jestjs.io/)

> **A sophisticated music discovery platform that uses AI and music theory to find harmonically compatible tracks for DJs, producers, and music enthusiasts.**

---

## 🌟 Overview

Intune is a web application that combines artificial intelligence with traditional music theory to help users discover tracks that work perfectly together. Search for any song on Spotify and instantly get up to 20 harmonically compatible tracks, complete with key signatures, BPM analysis, and seamless Spotify player integration.

**Perfect for:**

- 🎧 DJs creating seamless mixes
- 🎹 Producers finding complementary samples
- 🎼 Music enthusiasts exploring harmonic relationships
- 📚 Students learning music theory in practice

---

## ✨ Key Features

### 🔍 Intelligent Music Search

- **Artist & Song Search** - Find any track on Spotify's vast library
- **AI-Powered Suggestions** - ChatGPT analyzes musical characteristics for song recommendations

### 🎼 Advanced Music Theory Analysis

- **Key Signature Detection** - Automatic key detection using Soundnets API
- **BPM Analysis** - Precise tempo detection for perfect beat matching
- **Harmonic Compatibility Scoring** - Circle of Fifths-based algorithm (0-100 scale)
- **Camelot Notation Support** - Standard key notation and Camelot Wheel format

### 🎚️ Smart BPM Filtering

- **Dynamic Range Selection** - Filter by ±5, ±10, ±15, ±25 BPM or view all
- **Sort Options** - Organize by BPM ascending or descending
- **Half-time/Double-time Detection** - Considers tempo relationships (2x, 0.5x, 1.5x)

### 🎵 Integrated Spotify Players

- **Main Track Player** - Full Spotify embed with album artwork
- **Toggle Players** - Show/hide embeds for compatible tracks
- **Compact Mode** - Space-efficient players in track lists
- **30-Second Previews** - Quick listening for track evaluation

### 💾 Personal Playlist Management

- **Save Favorites** - Add compatible tracks to your personal collection
- **Persistent Storage** - Playlists linked to your Supabase account
- **Quick Actions** - One-click add/remove functionality
- **Visual Feedback** - Clear indication of saved tracks

### 🔐 Secure Authentication

- **Email/Password** - Traditional account creation
- **Google OAuth** - One-click sign-in with Google
- **Protected Routes** - Secure access to personal features
- **Session Management** - Automatic token refresh

### 🎨 Modern User Experience

- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Intuitive Interface** - Clean, music-focused design
- **Loading States** - Visual feedback for all async operations
- **Error Handling** - Graceful fallbacks and helpful error messages
- **Accessibility** - ARIA labels, semantic HTML, keyboard navigation

---

## 🛠️ Technology Stack

### Frontend

| Technology          | Version | Purpose                                   |
| ------------------- | ------- | ----------------------------------------- |
| **React**           | 18.3.1  | UI library with hooks and modern patterns |
| **React Router**    | 6.30.0  | Client-side routing and navigation        |
| **Axios**           | 1.9.0   | HTTP client for API requests              |
| **Webpack**         | 5.102.1 | Module bundler and dev server             |
| **Babel**           | 7.26.0  | JavaScript transpiler (ES6+ → ES5)        |
| **Jest**            | 29.7.0  | Testing framework                         |
| **Testing Library** | 16.3.0  | React component testing utilities         |

### Backend

| Technology     | Version | Purpose                            |
| -------------- | ------- | ---------------------------------- |
| **Node.js**    | 18+     | JavaScript runtime                 |
| **Express.js** | 4.21.2  | Web application framework          |
| **PostgreSQL** | -       | Relational database (via Supabase) |
| **Supabase**   | 2.49.4  | Authentication & database service  |
| **pg**         | 8.13.1  | PostgreSQL client for Node.js      |
| **Jest**       | 29.7.0  | Backend testing framework          |
| **Supertest**  | 7.1.0   | HTTP assertion library             |

### External APIs

- **Spotify Web API** - Track metadata and audio features
- **OpenAI API (ChatGPT)** - AI-powered music compatibility analysis
- **SoundNet API** (Optional) - Enhanced key/BPM detection

### Development Tools

- **ESLint** - Code linting and style enforcement
- **Nodemon** - Auto-restart development server
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

---

## 🚀 Quick Start

### Prerequisites

Make sure you have these installed:

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **npm** v9 or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

You'll also need accounts for:

- **Supabase** - [Sign up free](https://supabase.com)
- **Spotify Developer** - [Create app](https://developer.spotify.com/dashboard)
- **OpenAI** (Optional) - [Get API key](https://platform.openai.com/api-keys)

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Peter2oussaint/Intune.git
cd intune-app
```

---

### 2️⃣ Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create `.env` file from template:

```bash
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-service-role-key

# Spotify API Credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Database Connection
DATABASE_URL=postgresql://postgres:[password]@db.your-project-id.supabase.co:5432/postgres

# Optional: OpenAI API (for ChatGPT suggestions)
OPENAI_API_KEY=your_openai_api_key

# Optional: SoundNet API (for enhanced key/BPM detection)
SOUNDNET_API_KEY=your_soundnet_api_key
SOUNDNET_HOST=soundnet-api.rapidapi.com
```

#### Get Your Credentials

**Supabase:**

1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy **Project URL** (SUPABASE_URL)
4. Copy **service_role key** (SUPABASE_KEY) - ⚠️ Keep this secret!
5. Go to Settings → Database
6. Copy **Connection String** (DATABASE_URL)

**Spotify:**

1. Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy **Client ID** and **Client Secret**

**OpenAI (Optional):**

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new API key
3. Add to `.env` file

#### Start Backend Server

```bash
npm run dev
# Server starts on http://localhost:4000
```

---

### 3️⃣ Frontend Setup

Open a new terminal window:

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Configure Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `frontend/.env`:

```env
# Backend API URL
INTUNE_API_URL=http://localhost:4000

# Supabase Configuration (Frontend)
INTUNE_SUPABASE_URL=https://your-project-id.supabase.co
INTUNE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
```

⚠️ **Important**: Use the **anon/public key** for frontend (NOT the service_role key)

Find it in: Supabase Settings → API → Project API keys → **anon public**

#### Start Development Server

```bash
npm start
# Opens http://localhost:3000 automatically
```

---

### 4️⃣ Database Setup

#### Create Supabase Tables

Run these SQL commands in Supabase SQL Editor:

```sql
-- Users table (handled by Supabase Auth automatically)
-- No need to create manually

-- Playlists table
CREATE TABLE playlists (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  song_title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT,
  album_image_url TEXT,
  preview_url TEXT,
  key_info JSONB,
  scraped_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- Add index for faster queries
CREATE INDEX idx_playlists_user_id ON playlists(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only access their own playlists
CREATE POLICY "Users can view own playlists"
  ON playlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own playlists"
  ON playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 5️⃣ Verify Setup

✅ **Backend** should be running on `http://localhost:4000`
✅ **Frontend** should be running on `http://localhost:3000`
✅ You should be able to **sign up** and **log in**
✅ Try **searching** for a track (e.g., "Drake One Dance")

---

## 🧪 Testing

### Run All Tests

```bash
# From project root
npm test
```

### Run Specific Test Suites

```bash
# Frontend tests only
npm run test:frontend

# Backend tests only
npm run test:backend

# Watch mode (re-runs on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

```
✓ 25 backend tests
  ✓ User routes (3 tests)
  ✓ Playlist routes (9 tests)
  ✓ Spotify routes (4 tests)
  ✓ Harmonic compatibility (6 tests)
  ✓ ChatGPT service (2 tests)
  ✓ Music scraper (1 test)

✓ 42 frontend tests
  ✓ IntuneApp component (8 tests)
  ✓ SpotifyEmbed component (34 tests)

Total: 67 passing tests
```

---

## 🗄️ Project Structure

```
intune-app/
├── backend/
│   ├── auth/                      # Authentication middleware
│   │   └── auth.js                # Supabase auth helpers
│   ├── routes/                    # API endpoints
│   │   ├── spotify.js             # Spotify search & compatibility
│   │   ├── spotify.test.js
│   │   ├── playlists.js           # Playlist CRUD operations
│   │   ├── playlists.test.js
│   │   ├── users.js               # User management
│   │   └── users.test.js
│   ├── services/                  # Business logic
│   │   ├── harmonicCompatibility.js    # Music theory algorithm
│   │   ├── harmonicCompatibility.test.js
│   │   ├── chatgptCompatibility.js     # AI suggestions
│   │   ├── chatgptCompatibility.test.js
│   │   ├── musicDataScraper.js         # Web scraping
│   │   └── musicDataScraper.test.js
│   ├── db.js                      # PostgreSQL connection
│   ├── server.js                  # Express server setup
│   ├── setupTests.js              # Jest configuration
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── index.html             # HTML template
│   ├── src/
│   │   ├── assets/                # Images, logos, screenshots
│   │   ├── components/
│   │   │   ├── IntuneApp.js           # Main application
│   │   │   ├── IntuneApp.test.js
│   │   │   ├── SpotifyEmbed.js        # Spotify player component
│   │   │   ├── SpotifyEmbed.test.js
│   │   │   ├── TrackCard.js           # Track display component
│   │   │   ├── TrackCard.test.js
│   │   │   ├── TrackArtwork.js        # Album art component
│   │   │   ├── login.js               # Login page
│   │   │   ├── signup.js              # Signup page
│   │   │   ├── privateRoute.js        # Protected route wrapper
│   │   │   └── App.css                # Application styles
│   │   ├── utils/
│   │   │   └── supabaseClient.js      # Supabase client setup
│   │   ├── index.js               # React app entry point
│   │   └── setupTests.js          # Jest configuration
│   ├── webpack.config.js          # Webpack configuration
│   ├── package.json
│   └── .env.example
│
├── __mocks__/
│   └── fileMock.js                # Jest asset mocks
├── babel.config.js                # Babel configuration
├── jest.config.js                 # Jest configuration (root)
├── package.json                   # Root dependencies
├── .gitignore
└── README.md
```

---

## 🧠 How the Compatibility Algorithm Works

Intune uses a sophisticated multi-layered approach to find compatible tracks:

### 1. Key Signature Matching (60% weight)

The algorithm implements the **Circle of Fifths** from music theory:

- **Perfect Match (100 points)** - Same key
- **Relative Major/Minor (90 points)** - Am ↔ C Major
- **Perfect Fifth (80 points)** - C → G (clockwise on circle)
- **Perfect Fourth (80 points)** - C → F (counter-clockwise)
- **Parallel Major/Minor (70 points)** - C Major ↔ C Minor
- **Compatible Keys (60 points)** - Adjacent keys on circle
- **Distant Keys (30-50 points)** - Further relationships

**Supported Key Formats:**

- Standard notation (C Major, A Minor)
- Camelot notation (8B, 5A)
- Sharps and flats (C#, Db)

### 2. BPM Matching (40% weight)

The algorithm considers multiple tempo relationships:

- **Exact Match (100 points)** - Same BPM
- **Very Close (90 points)** - Within ±3 BPM
- **Close (80 points)** - Within ±5 BPM
- **Half-time (70 points)** - 2:1 ratio (140 → 70 BPM)
- **Double-time (70 points)** - 1:2 ratio (70 → 140 BPM)
- **3/2 Ratio (60 points)** - 1.5x relationship (120 → 80 BPM)
- **Moderate (40-60 points)** - Within ±25 BPM
- **Poor (<40 points)** - Large BPM differences

### 3. AI Enhancement (ChatGPT)

ChatGPT analyzes:

- **Genre compatibility** - Similar or complementary styles
- **Era and influence** - Tracks from similar time periods
- **Artist relationships** - Collaborations, similar sounds
- **Musical characteristics** - Mood, energy, instrumentation

### 4. Final Compatibility Score

```
Total Score = (Key Score × 0.6) + (BPM Score × 0.4)
```

**Score Interpretation:**

- **90-100** - Excellent (Perfect for seamless mixing)
- **75-89** - Very Good (Great compatibility)
- **60-74** - Good (Will mix well together)
- **40-59** - Fair (Requires DJ skill)
- **25-39** - Acceptable (Challenging but possible)
- **0-24** - Poor (Difficult to mix)

---

## 📡 API Documentation

### Authentication

All endpoints require authentication via Supabase session token.

### Spotify Routes

#### Search for Track and Get Compatible Music

```http
GET /api/spotify/track/:artist/:song
```

**Parameters:**

- `artist` (string) - Artist name
- `song` (string) - Song title

**Query Parameters:**

- `bpmFilter` (optional) - BPM range filter (5, 10, 15, 25, "all")

**Response:**

```json
{
  "main_track": {
    "id": "spotify:track:abc123",
    "name": "Song Title",
    "artists": [{ "name": "Artist Name" }],
    "album": {
      "name": "Album Name",
      "images": [{ "url": "https://..." }]
    },
    "key_info": {
      "key": "C Major",
      "bpm": "120",
      "source": "Spotify"
    }
  },
  "compatible_tracks": [
    {
      "id": "spotify:track:def456",
      "name": "Compatible Song",
      "artists": [{ "name": "Artist" }],
      "key_info": { "key": "G Major", "bpm": "122" },
      "compatibility_info": {
        "overall": {
          "score": 85,
          "compatibility": "very-good",
          "description": "Excellent match"
        },
        "key": { "score": 80, "reason": "Perfect Fifth" },
        "bpm": { "score": 90, "reason": "Very close tempo" }
      }
    }
  ]
}
```

### Playlist Routes

#### Get User Playlists

```http
GET /api/playlists?user_id={userId}
```

**Response:**

```json
[
  {
    "id": 1,
    "user_id": "uuid",
    "song_id": "abc123",
    "song_title": "Song Name",
    "artist_name": "Artist",
    "album_image_url": "https://...",
    "key_info": { "key": "C Major", "bpm": "120" },
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

#### Add Track to Playlist

```http
POST /api/playlists
Content-Type: application/json

{
  "user_id": "uuid",
  "song_id": "abc123",
  "song_title": "Song Name",
  "artist_name": "Artist",
  "album_name": "Album",
  "album_image_url": "https://...",
  "key_info": { "key": "C Major", "bpm": "120" }
}
```

#### Remove Track from Playlist

```http
DELETE /api/playlists/:id
```

### User Routes

#### Create/Update User

```http
POST /api/users
Content-Type: application/json

{
  "user_id": "uuid",
  "email": "user@example.com"
}
```

---

## 🚢 Deployment Guide

### Frontend Deployment (Vercel)

Vercel provides the easiest deployment for React applications:

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` directory as root

3. **Configure Environment Variables**

   In Vercel dashboard → Settings → Environment Variables:

   ```
   INTUNE_API_URL=https://your-backend.railway.app
   INTUNE_SUPABASE_URL=https://your-project.supabase.co
   INTUNE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Deploy**
   - Vercel auto-deploys on every push to `main`
   - Your app will be live at `https://your-app.vercel.app`

### Backend Deployment (Railway)

Railway is recommended for Node.js backends:

1. **Create Railway Account**

   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**

   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Environment Variables**

   In Railway dashboard → Variables:

   ```
   NODE_ENV=production
   PORT=4000
   SUPABASE_URL=https://...
   SUPABASE_KEY=your-service-role-key
   SPOTIFY_CLIENT_ID=...
   SPOTIFY_CLIENT_SECRET=...
   DATABASE_URL=postgresql://...
   OPENAI_API_KEY=... (optional)
   ```

4. **Set Root Directory**

   - Settings → Root Directory → `/backend`

5. **Deploy**

   - Railway auto-deploys
   - Copy your Railway URL (e.g., `https://intune-backend.railway.app`)

6. **Update Frontend**
   - Update `INTUNE_API_URL` in Vercel to point to Railway URL
   - Redeploy frontend

### Alternative: Render

**For Backend:**

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Root Directory: `backend`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Add environment variables

### Production Checklist

- [ ] All tests passing (`npm test`)
- [ ] Environment variables set in hosting platforms
- [ ] Database tables created in Supabase
- [ ] CORS configured to allow frontend domain
- [ ] Supabase Row Level Security (RLS) enabled
- [ ] Backend URL updated in frontend environment variables
- [ ] Test signup/login flow in production
- [ ] Test search and playlist functionality
- [ ] Monitor error logs after deployment

---

## 🔒 Security Best Practices

### Environment Variables

✅ **DO:**

- Keep separate `.env` files for development and production
- Use `.env.example` as templates (safe to commit)
- Add `.env` to `.gitignore`
- Use frontend **anon key** (safe for public)
- Use backend **service_role key** (keep secret)
- Rotate API keys regularly in production

❌ **DON'T:**

- Commit `.env` files to Git
- Share API keys in code or screenshots
- Use production credentials in development
- Expose service_role key in frontend code

### Supabase Security

1. **Enable Row Level Security (RLS)**

   ```sql
   ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
   ```

2. **Create Policies**

   ```sql
   CREATE POLICY "Users can only access own data"
   ON playlists
   USING (auth.uid() = user_id);
   ```

3. **Use Anon Key in Frontend**
   - Frontend should use `SUPABASE_ANON_KEY`
   - Backend should use `SUPABASE_SERVICE_ROLE_KEY`

### API Rate Limiting

The backend includes rate limiting for external APIs:

- Spotify API: Token caching
- ChatGPT: Request limiting + caching
- Database: Connection pooling

---

## 🎯 Usage Guide

### For DJs

1. **Find Your Base Track**

   - Search for the song you want to mix from
   - Check its key and BPM

2. **Discover Compatible Tracks**

   - Browse the 20 suggested tracks
   - Use BPM filter to narrow tempo range
   - Look for high compatibility scores (85+)

3. **Preview and Test**

   - Toggle Spotify players to preview tracks
   - Listen for harmonic compatibility
   - Check transition points

4. **Save Your Favorites**
   - Add tracks to your playlist
   - Export list for your DJ software

### For Producers

1. **Find Sample Complements**

   - Search for your main sample
   - Discover harmonically compatible samples

2. **Key Matching**

   - Match samples in same key
   - Use relative major/minor for contrast

3. **Build Your Collection**
   - Save compatible samples to playlist
   - Organize by key and BPM

---

## 🔮 Future Feature Roadmap

### Planned Features

#### 🎵 Enhanced Music Features

- [ ] **Spotify Playlist Export** - One-click export to Spotify account
- [ ] **Advanced Filters** - Genre, popularity, release date, energy level
- [ ] **Tempo Suggestions** - Automatic tempo transition recommendations

#### 🤖 AI & Analysis

- [ ] **Mood-Based Matching** - AI analysis of emotional characteristics
- [ ] **Automatic Set Creation** - Generate complete DJ sets with smooth transitions
- [ ] **Genre Intelligence** - Smart genre-aware compatibility scoring
- [ ] **Energy Flow Analysis** - Map energy levels across track sequences

#### 📱 Platform Expansion

- [ ] **Mobile App** - React Native iOS/Android app
- [ ] **Apple Music Integration** - Support for Apple Music library
- [ ] **YouTube Music** - Expand to YouTube Music API

#### 💡 User Experience

- [ ] **Drag & Drop Playlists** - Reorder tracks with drag and drop
- [ ] **Playlist Sharing** - Share playlists via unique URLs
- [ ] **Collaborative Playlists** - Work on playlists with other users

### How to Contribute

Want to help build these features? See the **Contributing** section below!

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

### Getting Started

1. **Fork the repository**

   ```bash
   git clone https://github.com/Peter2oussaint/Intune.git
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**

   - Write clean, documented code
   - Follow existing code style
   - Add tests for new features

4. **Test your changes**

   ```bash
   npm test
   ```

5. **Commit with clear messages**

   ```bash
   git commit -m "Add amazing feature: brief description"
   ```

6. **Push to your fork**

   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Describe your changes
   - Link related issues
   - Request review

### Development Guidelines

- **Code Style** - Follow ESLint configuration
- **Testing** - Maintain >80% test coverage
- **Documentation** - Update README for new features
- **Commits** - Use conventional commit messages
- **Issues** - Create issues before major changes

---

## 🐛 Known Issues

### Current Limitations

- **Spotify Preview Unavailability** - Some tracks don't have 30-second preview clips (Spotify API limitation)
- **BPM Filter Edge Cases** - Shows all tracks when reference track has no BPM data
- **Rate Limiting** - Heavy usage may hit Spotify/OpenAI rate limits
- **Key Detection Accuracy** - Automated key detection not 100% accurate for complex songs
- **Mobile Performance** - Spotify embeds may load slowly on mobile connections

### Reporting Bugs

Found a bug? Please [open an issue](https://github.com/Peter2oussaint/Intune/issues) with:

- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Your environment (browser, OS)

---

## 📸 Screenshots

### Main Search Interface

![Search Interface](frontend/src/assets/images/search-interface-empty.png)
(frontend/src/assets/images/search-interface.png)
_Search for any track and discover compatible music_

### Compatible Tracks & Playlist

![Compatible Tracks](frontend/src/assets/images/compatible-tracks.png)
_View harmonically compatible tracks with Spotify players_

### BPM Filtering

![BPM Filter](frontend/src/assets/images/bpm-filter.png)
_Filter compatible tracks by tempo range_

### Personal Playlist

![Playlist Management](frontend/src/assets/images/playlist.png)
_Save and manage your favorite compatible tracks_

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 [Peter Toussaint]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

[Full MIT License text...]
```

---

## 👤 Author

**Peter Toussaint**

- 🌐 Portfolio: https://peter2oussaint.github.io/pt-portfolio/
- 💼 LinkedIn: https://www.linkedin.com/in/petertoussaint/
- 🐙 GitHub: https://github.com/Peter2oussaint
- 📧 Email: toussa91@gmail.com

---

## 🙏 Acknowledgments

### Technologies

- **Spotify** - For their comprehensive Web API and music data
- **Supabase** - For authentication and database infrastructure
- **OpenAI** - For ChatGPT API enabling AI-powered suggestions
- **React Team** - For the excellent React library and documentation

### Community

- All contributors and testers who helped improve Intune
- The DJ and producer community for feedback
- Music theory educators for knowledge sharing

---

## 📞 Support

Need help? Here are your options:

- 📚 **Documentation** - Read this README thoroughly
- 🐛 **Bug Reports** - [Open an issue](https://github.com/Peter2oussaint/Intune/issues)
- 💡 **Feature Requests** - [Submit an idea](https://github.com/Peter2oussaint/Intune/issues)
- 💬 **Questions** - [Start a discussion](https://github.com/Peter2oussaint/Intune/discussions)
- 📧 **Email** - toussa91@gmail.com

---

⭐ **Star this repo if you found it helpful!** ⭐

[View Demo](https://intune.vercel.app) •[Report Bug]• [Request Feature](https://github.com/Peter2oussaint/Intune/issues)
