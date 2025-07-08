# Digital Lava Lamp - A Soothing Physics Diorama

## Overview

This is a full-stack web application that creates a **digital lava lamp experience** - a mesmerizing, continuous physics diorama designed for relaxation and gentle interaction. The app features circular sprites that gently roll down inclined platforms in a Donkey Kong-inspired zigzag layout, optimized for toddlers and stress relief.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the main UI framework
- **React Three Fiber** for 3D rendering and physics simulation
- **Tailwind CSS** with **Radix UI** components for styling
- **Zustand** for state management (game state and audio controls)
- **TanStack React Query** for server state management
- **Vite** for build tooling and development server

### Backend Architecture
- **Express.js** server with TypeScript
- **PostgreSQL** database with **Drizzle ORM**
- **Neon Database** for serverless PostgreSQL hosting
- In-memory storage fallback for development
- RESTful API structure (though minimal endpoints currently)

### Key Technologies
- **3D Graphics**: React Three Fiber, Drei helpers, Three.js
- **Physics**: Custom physics engine with reduced gravity
- **Audio**: Web Audio API with mute controls
- **Database**: PostgreSQL with Drizzle migrations
- **Deployment**: Configured for production builds

## Key Components

### 3D Scene Components
- **LavaLamp**: Main orchestrator component managing the entire experience
- **Coin**: Individual rolling sprites with physics properties
- **Platform**: Inclined wooden platforms in zigzag pattern
- **Barn**: Decorative spawning structure at the top
- **ParticleEffect**: Sparkle effects for user interactions

### Game Systems
- **Physics Engine**: Custom implementation with 30% gravity, bounce damping, and rolling friction
- **Audio Manager**: Background music and interaction sounds with mute controls
- **Spawn System**: Automatic coin generation every 8-12 seconds
- **Interaction System**: Single-tap to nudge coins with gentle feedback

### State Management
- **Game State**: Phase management (ready/playing/ended)
- **Audio State**: Sound controls and mute functionality
- **Physics State**: Coin positions, velocities, and platform collisions

## Data Flow

1. **Scene Initialization**: Canvas loads with 3D scene, platforms, and barn
2. **Continuous Spawning**: New coins appear at top every 8-12 seconds
3. **Physics Updates**: 60fps physics simulation with gravity and collisions
4. **User Interaction**: Touch/click detection for coin nudging
5. **Audio Feedback**: Gentle sounds on interaction (respecting mute state)
6. **Cleanup**: Coins fade out when reaching bottom

### Physics Pipeline
- Gravity application (reduced to 30% of normal)
- Velocity updates and position integration
- Platform collision detection and response
- Bounce damping and rolling friction
- Rotation updates for rolling effect

## External Dependencies

### Core Libraries
- **@react-three/fiber**: 3D rendering in React
- **@react-three/drei**: 3D helpers and utilities
- **@react-three/postprocessing**: Visual effects
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@radix-ui/react-**: Accessible UI components
- **@tanstack/react-query**: Server state management

### Development Tools
- **Vite**: Build tool with hot reload
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Fast bundling for production

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite compiles React app to `dist/public`
2. **Backend Build**: ESBuild bundles server to `dist/index.js`
3. **Database Migration**: Drizzle handles schema changes
4. **Asset Optimization**: GLTF models, textures, and audio files

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Production/development flag
- **Port Configuration**: Express server setup

### Production Deployment
- **Static Assets**: Served from `dist/public`
- **API Routes**: Express server handles `/api/*` endpoints
- **Database**: Neon PostgreSQL with connection pooling
- **Error Handling**: Comprehensive error boundaries and logging

### Performance Optimizations
- **Asset Loading**: Lazy loading for 3D models and textures
- **Physics Optimization**: Efficient collision detection
- **Memory Management**: Coin cleanup and particle recycling
- **Mobile Optimization**: Touch-friendly controls and responsive design

The application is designed to run continuously without user intervention while providing gentle, optional interaction opportunities. The architecture supports both standalone operation and potential future multiplayer features.