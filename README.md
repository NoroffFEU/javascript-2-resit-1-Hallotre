# Old Games Platform

A responsive web application for exploring classic PC games. Browse, search, and save your favorite retro games.

## 🎮 Features

- Browse classic PC games with search and filtering
- View detailed game information and genres
- User registration and authentication
- Personal favorites system
- Responsive design for all devices

## 🚀 Quick Start

### Prerequisites
- Node.js (for CSS building)
- Modern web browser
- Valid Noroff student email for registration

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build CSS**
   ```bash
   npm run build-css-prod
   ```

3. **Start local server**
   ```bash
   npm run serve
   ```

4. **Open browser**
   Navigate to `http://localhost:3000`

### Development
For development with auto-rebuild:
```bash
npm run dev
```

## 🎯 How to Use

1. **Browse Games**: Homepage shows all available games
2. **Search**: Use the search bar to find specific games
3. **Filter**: Click on genres to filter games
4. **Register**: Create account with your `@stud.noroff.no` email
5. **Favorites**: Click heart icons to save favorite games
6. **Profile**: View your profile and manage favorites

## 🛠️ Built With

- **Frontend**: HTML, CSS (Tailwind v4), JavaScript (ES6)
- **API**: Noroff API v2
- **Icons**: Font Awesome
- **Storage**: LocalStorage

## 📁 Project Structure

```
├── index.html              # Homepage
├── login.html              # Login page  
├── register.html           # Registration page
├── game-details.html       # Game details page
├── genre.html              # Genre-specific games
├── profile.html            # User profile
├── css/style.css           # Compiled CSS
├── js/                     # JavaScript modules
│   ├── api.js              # API calls and utilities
│   ├── auth.js             # Authentication
│   ├── main.js             # Homepage functionality
│   ├── game-details.js     # Game details
│   ├── genre.js            # Genre filtering
│   └── profile.js          # Profile management
└── package.json            # Dependencies and scripts
```

## 🚀 Deployment

1. Build production CSS: `npm run build-css-prod`
2. Deploy to GitHub Pages, Netlify, or Vercel
3. Ensure CSS is built before deployment

## 📖 API

Uses Noroff API v2 (`https://v2.api.noroff.dev/old-games`) for game data and user authentication.

## 📝 Development Notes

**Note**: The initial commit contains most of the project code since I tend to forget making regular commits during development. Future updates will have more granular commit history.

## 📄 License

Educational project for Noroff curriculum. 