# Retell AI API

A TypeScript REST API for managing Retell AI agents, built with Fastify and Clean Architecture principles.

## Features

- 🏗️ **Clean Architecture**: Separation of concerns with clear domain, application, and infrastructure layers
- 🚀 **Fastify**: High-performance web framework with built-in validation and serialization
- 📝 **TypeScript**: Full type safety across the application
- ✅ **Validation**: Request/response validation using Zod schemas
- 📚 **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- 🧪 **Testing**: Comprehensive unit and integration tests with Jest
- 🔍 **Error Handling**: Structured error handling with proper HTTP status codes
- 📊 **Health Checks**: Built-in health, readiness, and liveness endpoints
- 🔧 **Configuration**: Environment-based configuration with validation
- 📈 **Logging**: Structured logging with Pino

## API Endpoints

### Agents
- `GET /api/v1/agents` - List all agents
- `GET /api/v1/agents/:id` - Get agent by ID
- `GET /api/v1/agents/:id/prompt` - Get agent's system prompt

### Health
- `GET /health` - Health check with service status
- `GET /readiness` - Kubernetes readiness probe
- `GET /liveness` - Kubernetes liveness probe

### Documentation
- `GET /docs` - Swagger UI (development only)
- `GET /` - API information

## Project Structure

```
src/
├── app/              # Application layer
│   ├── dto/          # Data Transfer Objects
│   ├── ports/        # Repository interfaces
│   └── validators/   # Request/response schemas
├── core/             # Domain layer
│   ├── entities/     # Domain entities
│   └── use-cases/    # Business logic
├── infra/            # Infrastructure layer
│   ├── http/         # External HTTP clients
│   └── web/          # Web framework setup
├── common/           # Shared utilities
│   ├── errors/       # Error classes
│   ├── middleware/   # Request middleware
│   ├── types/        # Common types
│   └── utils/        # Utility functions
└── config/           # Configuration management
```

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A Retell AI API key

## Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd retell-ai-api
   npm install
   ```

2. **Environment configuration:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   ```env
   NODE_ENV=development
   PORT=3000
   HOST=localhost
   RETELL_API_KEY=your_retell_api_key_here
   RETELL_BASE_URL=https://api.retellai.com/v2
   LOG_LEVEL=info
   API_TIMEOUT=10000
   API_RETRY_ATTEMPTS=3
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## Development

### Running the server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start at `http://localhost:3000` by default.

### Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Check code style
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking
- `npm run validate` - Run type checking, linting, and tests
- `npm run clean` - Remove build artifacts

### Testing

The project includes comprehensive test coverage:

**Run all tests:**
```bash
npm test
```

**Run tests with coverage:**
```bash
npm run test:coverage
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

### API Documentation

In development mode, Swagger UI is available at:
```
http://localhost:3000/docs
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|-----------|
| `NODE_ENV` | Environment (development/testing/production) | `development` | No |
| `PORT` | Server port | `3000` | No |
| `HOST` | Server host | `localhost` | No |
| `RETELL_API_KEY` | Retell AI API key | - | **Yes** |
| `RETELL_BASE_URL` | Retell AI API base URL | `https://api.retellai.com/v2` | No |
| `LOG_LEVEL` | Logging level (trace/debug/info/warn/error/fatal) | `info` | No |
| `API_TIMEOUT` | HTTP request timeout (ms) | `10000` | No |
| `API_RETRY_ATTEMPTS` | Number of retry attempts | `3` | No |

## Usage Examples

### List all agents
```bash
curl http://localhost:3000/api/v1/agents
```

Response:
```json
{
  "data": [
    {
      "id": "agent-123",
      "name": "Customer Service Agent",
      "prompt": "You are a helpful customer service agent...",
      "voiceId": "voice-456",
      "language": "en",
      "model": "gpt-4",
      "temperature": 0.7,
      "maxTokens": 1000,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "message": "Agents retrieved successfully"
}
```

### Get specific agent
```bash
curl http://localhost:3000/api/v1/agents/agent-123
```

### Get agent prompt
```bash
curl http://localhost:3000/api/v1/agents/agent-123/prompt
```

### Health check
```bash
curl http://localhost:3000/health
```

## Error Handling

The API returns structured error responses:

```json
{
  "error": {
    "message": "Agent with ID agent-999 not found",
    "code": "NotFoundError",
    "context": {
      "agentId": "agent-999"
    }
  }
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `502` - Bad Gateway (external service errors)
- `500` - Internal Server Error

## Architecture

This project follows Clean Architecture principles:

- **Domain Layer** (`src/core/`): Contains business entities and use cases
- **Application Layer** (`src/app/`): Contains DTOs, validation schemas, and port definitions
- **Infrastructure Layer** (`src/infra/`): Contains external integrations (HTTP clients, web framework)
- **Common Layer** (`src/common/`): Contains shared utilities and types

### Dependencies Flow
- Domain layer has no dependencies
- Application layer depends only on domain
- Infrastructure layer can depend on application and domain
- All layers can use common utilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the validation suite: `npm run validate`
6. Submit a pull request

## License

ISC License