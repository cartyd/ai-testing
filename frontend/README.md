# Voice Testing Frontend

React TypeScript application for managing and viewing voice agents.

## Features

- **Agent List**: Browse all available voice agents in a responsive grid layout
- **Agent Details**: View detailed information about individual agents
- **Agent Prompts**: View and copy system prompts for each agent
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Error Handling**: Graceful error states and retry functionality
- **Loading States**: Clean loading indicators for better UX

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Backend API running on `http://localhost:3000`

### Installation

```bash
# Install dependencies (from root directory)
npm install

# Start development server
npm run dev:frontend
```

The app will be available at `http://localhost:3001`

### Environment Variables

Create a `.env` file in the frontend directory:

```bash
REACT_APP_API_URL=http://localhost:3000
BROWSER=none
```

## API Integration

The frontend communicates with the backend API endpoints:

- `GET /api/v1/agents` - Lists all agents
- `GET /api/v1/agents/:id` - Gets agent details
- `GET /api/v1/agents/:id/prompt` - Gets agent prompt

## Project Structure

```
src/
├── components/           # React components
│   ├── AgentList.tsx    # Agent list grid view
│   ├── AgentDetail.tsx  # Agent detail page
│   ├── AgentList.css    # Styles for agent list
│   └── AgentDetail.css  # Styles for agent detail
├── services/            # API service layer
│   └── api.ts          # HTTP client and API functions
├── hooks/              # Custom React hooks
│   └── useApi.ts       # API state management hooks
└── types/              # TypeScript type definitions
```

## Usage

### Viewing Agents

1. Navigate to the home page to see all agents
2. Click on any agent card to view details
3. Use the "Details" and "Prompt" tabs to see different information
4. Click "Copy Prompt" to copy the system prompt to clipboard
5. Use "← Back to Agents" to return to the list

### Error Handling

- Network errors show retry buttons
- Invalid agent IDs redirect to the home page
- Loading states provide user feedback during API calls

## Available Scripts

### `npm start` or `npm run dev`

Runs the app in development mode at [http://localhost:3001](http://localhost:3001)

### `npm run build`

Builds the app for production to the `build` folder.

### `npm test`

Launches the test runner in interactive watch mode.

## Shared Types

The frontend uses shared TypeScript types from the `shared` package:

- `Agent` - Agent data structure
- `AgentPrompt` - Agent prompt structure  
- `ApiResponse<T>` - API response wrapper
- `HealthStatus` - Health check response

## Development

To work on the frontend:

1. Ensure the backend is running on port 3000
2. Start the frontend dev server: `npm run dev`
3. Make changes to components, styles, or services
4. The app will hot-reload automatically
