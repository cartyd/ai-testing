# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development Workflow
- `npm run dev` - Start development server with auto-reload (most common for active development)
- `npm run build` - Compile TypeScript to JavaScript in `dist/` directory
- `npm start` - Start production server from compiled code

### Testing & Quality
- `npm test` - Run all tests (unit and integration)
- `npm run test:watch` - Run tests in watch mode (useful during TDD)
- `npm run test:coverage` - Generate test coverage report (80% threshold required)
- `npm run validate` - Full validation pipeline: typecheck + lint + test (run before commits)

### Code Quality Tools
- `npm run typecheck` - TypeScript type checking without building
- `npm run lint` - ESLint check for code style issues
- `npm run lint:fix` - Auto-fix ESLint issues where possible
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is properly formatted

### Utilities
- `npm run clean` - Remove build artifacts (`dist/` and `coverage/`)

### Single Test Execution
Use Jest's pattern matching to run specific tests:
```bash
# Run specific test file
npm test -- agent.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should list agents"

# Run tests in specific directory
npm test -- tests/unit/use-cases/
```

## Architecture Overview

This project implements **Clean Architecture** with clear separation of concerns across four layers:

### Layer Structure
```
src/
├── core/           # Domain Layer - Business entities and use cases
├── app/            # Application Layer - DTOs, validation, ports
├── infra/          # Infrastructure Layer - External integrations
└── common/         # Shared utilities across all layers
```

### Dependency Flow Rules
- **Domain** (`core/`) has zero external dependencies
- **Application** (`app/`) depends only on Domain
- **Infrastructure** (`infra/`) can depend on Application and Domain
- **Common** can be used by all layers

### Key Architectural Patterns

#### Repository Pattern
- Interfaces defined in `app/ports/` (e.g., `AgentRepository`)
- Implementations in `infra/` (e.g., `RetellAgentRepository`)
- Use cases consume repositories through interfaces, not concrete implementations

#### Use Cases Pattern
- Business logic encapsulated in `core/use-cases/`
- Each use case is a single responsibility class
- Use cases coordinate between repositories and entities

#### Error Handling Strategy
- Custom error hierarchy in `common/errors/`
- Domain errors extend `BaseError` with specific HTTP status codes
- Centralized error handling middleware in `common/middleware/`

## Import Path Strategy

The project uses path aliases configured in `jest.config.js`:
- `@src/` → `src/`
- `@app/` → `src/app/`
- `@core/` → `src/core/`
- `@common/` → `src/common/`
- `@infra/` → `src/infra/`
- `@config/` → `src/config/`

**Prefer the most specific alias available** when updating imports.

## Configuration Management

Environment configuration is handled through:
- `src/config/index.ts` - Centralized config with Zod validation
- `.env.example` - Template for environment variables
- Required: `RETELL_API_KEY` (Retell AI integration)
- Development: Swagger UI available at `http://localhost:3000/docs`

## External Service Integration

The project integrates with **Retell AI** through:
- `RetellApiClient` in `infra/http/retell-client.ts`
- Repository implementation in `infra/http/retell-repository.ts`
- Error handling for external service failures (502 status codes)

## Testing Architecture

### Test Organization
- `tests/unit/` - Unit tests for business logic and schemas
- `tests/integration/` - Integration tests for API endpoints
- `tests/setup.ts` - Global test configuration
- `tests/jest-setup.ts` - Jest-specific setup

### Test Patterns
- **Table-driven tests** with valid, invalid, and edge cases
- **Meaningful test names** describing specific behaviors
- **Single responsibility** - each test focuses on one aspect
- **80% coverage threshold** enforced for branches, functions, lines, statements

## Technology Stack Context

- **Framework**: Fastify (high-performance web framework)
- **Validation**: Zod schemas for request/response validation
- **API Docs**: Swagger/OpenAPI auto-generation
- **Logging**: Pino structured logging
- **HTTP Client**: Axios for external API calls
- **Error Handling**: Custom error hierarchy with proper HTTP status codes

## Development Notes

### When Adding New Features
1. Start with domain entities in `core/entities/`
2. Define use cases in `core/use-cases/`
3. Create port interfaces in `app/ports/`
4. Implement infrastructure in `infra/`
5. Add validation schemas in `app/validators/`
6. Create comprehensive tests following the table-driven pattern

### When Debugging External API Issues
- Check `server.log` for structured Pino logs
- External service errors return 502 status codes
- Retell AI client has built-in retry logic (3 attempts by default)
- Use `npm run dev` for detailed error output with auto-reload

### Environment Setup
Copy `.env.example` to `.env` and configure `RETELL_API_KEY` for external API integration.