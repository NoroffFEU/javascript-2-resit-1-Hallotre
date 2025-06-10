# 🎮 Old Games Platform - Windows 98 Edition

A nostalgic web application for exploring classic PC games with an authentic Windows 98 aesthetic. Browse, search, and manage your favorite retro games in true 90s style!

## 🌐 Live Demo

**🚀 [Visit the Live Site](https://old-games-platform.vercel.app/)**

Experience the complete Windows 98 gaming platform, deployed on Vercel with full functionality.

## ✨ Features

### 🎨 Authentic Windows 98 Experience
- **Complete visual overhaul** with authentic Windows 98 styling
- **Authentic UI elements**: Window chrome, titlebar controls, 3D button effects
- **Classic color scheme**: Teal desktop background, silver system colors
- **MS Sans Serif typography** for that genuine retro feel
- **Responsive design** that maintains the retro aesthetic across all devices

### 🎮 Game Management
- **Browse classic PC games** with intuitive search and filtering
- **Detailed game information** with enhanced Windows 98 styled pages
- **Genre-based filtering** with clickable genre tags
- **Advanced search functionality** across game titles and descriptions
- **Professional game cards** with hover effects and proper information hierarchy

### 👤 User Experience  
- **User registration and authentication** with Noroff API integration
- **Personal favorites system** with heart-based favoriting
- **Enhanced profile management** with avatar support and bio editing
- **Favorites search and management** with dedicated profile section
- **Quick actions** for efficient navigation

### 🔧 Technical Features
- **Local storage persistence** for user data and favorites
- **Error handling and loading states** with Windows 98 styled components
- **Form validation** with authentic system dialog styling
- **Mobile-responsive design** with adaptive layouts

## 🚀 Quick Start

### Prerequisites
- Node.js (for CSS building with Tailwind)
- Modern web browser
- Valid Noroff student email for registration

### Local Development Setup

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build CSS**
   ```bash
   npm run build
   ```

4. **Start local server**
   ```bash
   npm run server
   ```

### Development Commands
```bash
# Build CSS for production (minified)
npm run build

# Build CSS with watch mode for development
npm run build-css

# Start local HTTP server
npm run server

# Development mode (CSS watch)
npm run dev
```

## 🎯 How to Use

### 🏠 Homepage
1. **Browse Games**: View all available games in a Windows 98 styled grid
2. **Search Games**: Use the search bar to find specific titles
3. **Filter by Genre**: Click genre tags to filter games by category
4. **Add to Favorites**: Click the heart icon on any game card

### 🔐 Authentication
1. **Register**: Create account with your `@stud.noroff.no` email address
2. **Login**: Access your personal profile and favorites
3. **Logout**: Securely sign out from your account

### 👤 Profile Management
1. **View Profile**: Access your user information and statistics
2. **Edit Profile**: Update your bio and avatar
3. **Manage Favorites**: View, search, and organize your favorite games
4. **Quick Actions**: Access frequently used features

### 🎮 Game Details
1. **Detailed Information**: View comprehensive game data
2. **Related Games**: Discover similar games
3. **Favorite Management**: Add/remove from favorites directly

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup structure
- **CSS**: Custom Windows 98 theme built with Tailwind CSS v4.1.8
- **JavaScript (ES6+)**: Modern vanilla JavaScript with modules
- **Font Awesome**: Icons and visual elements

### Backend & Services
- **Noroff API v2**: Game data and user authentication
- **Local Storage**: Client-side data persistence
- **Vercel**: Production hosting and deployment

### Development Tools
- **Tailwind CLI**: CSS compilation and optimization
- **http-server**: Local development server
- **Vercel CLI**: Deployment and hosting management

## 📁 Enhanced Project Structure

```
├── index.html              # Homepage with Windows 98 game grid
├── login.html              # Authentication page
├── register.html           # User registration
├── game-details.html       # Enhanced game details with hero layout
├── genre.html              # Genre-filtered game listings
├── profile.html            # Complete profile management system
├── css/
│   └── style.css           # Compiled Windows 98 theme
├── input.css               # Source CSS with Windows 98 variables
├── js/                     # JavaScript modules
│   ├── api.js              # API integration and utilities
│   ├── auth.js             # Authentication logic
│   ├── main.js             # Homepage functionality
│   ├── game-details.js     # Game details page logic
│   ├── genre.js            # Genre filtering system
│   └── profile.js          # Profile and favorites management
├── vercel.json             # Vercel deployment configuration
└── package.json            # Dependencies and build scripts
```

## 🎨 Design System

### Windows 98 Theme Variables
- **Primary Background**: `#c0c0c0` (Classic Windows silver)
- **Desktop Background**: `teal` (Authentic Windows 98 desktop)
- **Button Effects**: 3D outset/inset borders for authentic feel
- **Typography**: MS Sans Serif font family
- **Interactive Elements**: Hover and active states matching Windows 98 behavior

### Component Library
- **Windows**: Authentic window chrome with titlebar controls
- **Buttons**: 3D button effects with proper hover/active states
- **Forms**: Inset field styling with proper focus indicators
- **Cards**: Game cards with Windows 98 styled borders and effects
- **Navigation**: Classic menu and button styling

## 🚀 Deployment

### Vercel Deployment (Current)
The project is deployed on Vercel with automatic builds:

```bash
# Deploy to Vercel
npm run build  # Build CSS
vercel         # Deploy to Vercel
```

### Manual Deployment Options
1. **Build production CSS**: `npm run build`
2. **Deploy to any static hosting**: Netlify, GitHub Pages, etc.
3. **Ensure CSS is built** before deployment

## 📖 API Integration

### Noroff API v2
- **Base URL**: `https://v2.api.noroff.dev/old-games`
- **Features**: Game browsing, user management, favorites system

## 📝 Development Notes

### Recent Major Updates
- **Complete Windows 98 transformation** of all pages and components
- **Enhanced profile system** with avatar management and bio editing
- **Improved favorite cards** with proper Windows 98 styling
- **Professional game details layout** with hero sections
- **Responsive design improvements** maintaining retro aesthetic
- **Vercel deployment** with optimized build configuration

### Technical Decisions
- **Vanilla JavaScript**: Chosen for simplicity and educational value
- **Tailwind CSS**: Custom Windows 98 theme built on Tailwind foundation
- **Local Storage**: Client-side persistence for offline-capable experience
- **Module System**: ES6 modules for organized, maintainable code

## 📄 License

Educational project for Noroff Front-End Development curriculum.

---

**Built with ❤️ and lots of Windows 98 nostalgia** 🖥️✨ 