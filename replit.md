# Overview

This is a Korean word similarity battle game where players compete in 5-round matches by submitting words that are semantically similar to a target word. The game uses FastText Korean word embeddings to calculate semantic similarity scores, with the highest total score across rounds determining the winner. Players can compete against other humans or AI bots of varying difficulty levels in real-time multiplayer sessions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React 18 and TypeScript using Vite as the build tool. The UI framework is shadcn/ui with Radix UI components and Tailwind CSS for styling. The application uses Wouter for client-side routing and TanStack Query for state management and API caching. Real-time game updates are handled through WebSocket connections managed by a custom WebSocketManager class.

## Backend Architecture
The server uses Express.js with TypeScript running on Node.js. The architecture follows a layered approach with separate route handlers, service classes, and storage abstractions. Game logic is centralized in a GameEngine service that manages round progression, word validation, and scoring. A BotPlayer service provides AI opponents with configurable difficulty levels. The server supports both HTTP REST endpoints and WebSocket connections for real-time game updates.

## Data Storage Solutions
The application uses Drizzle ORM with PostgreSQL for data persistence, specifically configured for Neon Database. The schema includes tables for users, games, game submissions, and matchmaking queues. For development and testing, there's a MemStorage implementation that provides in-memory storage. Database migrations are managed through Drizzle Kit with migrations stored in a separate directory.

## Authentication and Authorization
User authentication is simplified with localStorage-based session management. Users create accounts by providing a nickname, and the system generates unique user IDs. No complex authentication flows are implemented - the focus is on game functionality rather than security features.

## External Dependencies
The core game logic depends on Korean word similarity calculations using FastText embeddings (cc.ko.300.vec). The current implementation includes placeholder services that will integrate with pre-processed Korean word vectors similar to the Semantle-ko project. The application is designed to run on Replit with development-specific plugins for error handling and debugging.