# CodeHub

A real-time chat application built with Angular and Node.js in an Nx monorepo.

## Overview

CodeHub is a modern chat application featuring real-time messaging, room management, and AI-powered bot interactions. Built with Angular for the frontend and Express.js for the backend, all managed within an Nx monorepo for optimal development experience.

## Monorepo Structure

```
codehub/
├── apps/
│   ├── code-hub/          # Angular client application
│   │   ├── src/app/       # Angular components and services
│   │   └── src/environments/ # Environment configurations
│   └── chat-server/       # Node.js Express server
│       ├── src/services/  # Backend services (bot, database, etc.)
│       └── src/realtime/  # Socket.io real-time functionality
└── libs/
    └── shared-models/     # Shared TypeScript interfaces and types
```

### Applications

- **`code-hub`** - Angular frontend with real-time chat interface, room management, and responsive design
- **`chat-server`** - Express.js backend with Socket.io for real-time communication, PostgreSQL database, and AI bot integration

### Libraries

- **`shared-models`** - Shared TypeScript interfaces and data models used across frontend and backend

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm
- PostgreSQL database

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory with your database and API configuration:

   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/codehub
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start the development servers:**

   **Option 1: Run both apps simultaneously**

   ```bash
   npm run client    # Starts Angular dev server
   npm run server    # Starts Express server with nodemon
   ```

   **Option 2: Run individually**

   ```bash
   # Frontend only
   nx serve code-hub

   # Backend only
   nx serve chat-server
   ```

### Available Scripts

- `npm run client` - Start Angular development server
- `npm run server` - Start Express server with auto-reload
- `npm run build` - Build all applications
- `npm test` - Run all tests
- `nx serve code-hub` - Serve Angular app
- `nx serve chat-server` - Serve Express server

### Development

- **Frontend**: http://localhost:4200
- **Backend**: http://localhost:3000

## Technology Stack

- **Frontend**: Angular 20, Tailwind CSS, Socket.io Client
- **Backend**: Node.js, Express, Socket.io, PostgreSQL, Winston logging
- **Build System**: Nx 21.3.11
- **Testing**: Jest
- **Linting**: ESLint

## Learn More

- [Nx Documentation](https://nx.dev)
- [Angular Documentation](https://angular.io/docs)
- [Express.js Documentation](https://expressjs.com)
