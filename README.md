# User Management Microservice

A robust and scalable User Management Microservice built with NestJS, TypeORM, MySQL, and Redis. This service provides complete CRUD operations for user management with built-in caching, validation, and comprehensive error handling.

## Features

- **Complete CRUD Operations**: Create, Read, Update, and Delete users
- **Redis Caching**: Efficient caching layer to reduce database load
- **Data Validation**: Comprehensive input validation using class-validator
- **Unique Email Constraint**: Ensures email uniqueness across the system
- **Soft Delete**: Users are soft-deleted, preserving data integrity
- **Password Hashing**: Automatic password hashing with bcrypt
- **Pagination Support**: Efficient pagination for listing users
- **Error Handling**: Graceful error handling with meaningful messages
- **Docker Support**: Fully containerized application with Docker Compose
- **TypeScript**: Strictly typed codebase
- **Test Coverage**: Unit and E2E tests with 80%+ coverage target

## Prerequisites

- Node.js >= 22.x
- pnpm >= 10.x
- Docker and Docker Compose (for containerized deployment)
- MySQL 8.0 (or use Docker)
- Redis (or use Docker)

## Technology Stack

- **Framework**: NestJS 11
- **ORM**: TypeORM
- **Database**: MySQL 8.0
- **Cache**: Redis
- **Validation**: class-validator & class-transformer
- **Testing**: Jest & Supertest
- **Containerization**: Docker & Docker Compose

## Installation

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd user-ms.be
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MySQL and Redis locally** (or use Docker Compose)

5. **Run the application**

   ```bash
   # Development mode
   pnpm run start:dev

   # Production mode
   pnpm run build
   pnpm run start:prod
   ```

### Docker Deployment

1. **Copy environment file**

   ```bash
   cp .env.example .env
   # Adjust values for Docker environment
   ```

2. **Build and start all services**

   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - API: <http://localhost:3000>
   - MySQL: localhost:3306
   - Redis: localhost:6379

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_TYPE=mysql
DB_HOST=db                    # Use 'localhost' for local dev, 'db' for Docker
DB_PORT=3306
DB_USERNAME=user
DB_PASSWORD=root
DB_DATABASE=user_management
DB_SYNCHRONIZE=true           # Set to 'false' in production

# Redis Cache
REDIS_HOST=caching            # Use 'localhost' for local dev, 'caching' for Docker
REDIS_PORT=6379
CACHE_TTL=300000              # 5 minutes in milliseconds
```

### Docker Configuration

The `docker-compose.yml` orchestrates three services:

- **server**: NestJS application
- **db**: MySQL 8.0 database
- **caching**: Redis cache

All services are connected via a custom Docker network with health checks.

## API Endpoints

### Base URL

```text
http://localhost:3000/users
```

### Endpoints

#### 1. Create User

```http
POST /users
Content-Type: application/json

{
  "firstName": "John",
  "middleName": "M",        // Optional
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123", // Min 6 characters
  "phone": "+1234567890"
}

Response: 201 Created
```

#### 2. List Users

```http
GET /users?skip=0&limit=20&order=asc

Response: 200 OK
[
  {
    "id": 1,
    "firstName": "John",
    "middleName": "M",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "isActive": true,
    "createdAt": "2025-12-13T...",
    "updatedAt": "2025-12-13T..."
  }
]
```

#### 3. Get Single User

```http
GET /users/:id

Response: 200 OK
{
  "id": 1,
  "firstName": "John",
  ...
}

Response: 404 Not Found (if user doesn't exist)
```

#### 4. Update User

```http
PATCH /users/:id
Content-Type: application/json

{
  "firstName": "Jane",
  "email": "jane@example.com"
}

Response: 200 OK
```

#### 5. Delete User

```http
DELETE /users/:id

Response: 204 No Content
```

## Testing

### Unit Tests

```bash
# Run unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage report
pnpm run test:cov
```

### E2E Tests

```bash
# Run e2e tests
pnpm run test:e2e
```

### Test Coverage

The project targets **80%+ code coverage** with comprehensive tests for:

- User service operations
- Controller endpoints
- Validation logic
- Error handling
- Cache behavior
- Complete CRUD workflows

## Project Structure

```text
src/
├── common/
│   ├── dto/
│   │   └── pagination.dto.ts
│   ├── exceptions/
│   │   ├── user-not-found.exception.ts
│   │   └── duplicate-email.exception.ts
│   └── filters/
│       └── http-exception.filter.ts
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   └── redis.config.ts
├── module/
│   └── users/
│       ├── dto/
│       │   ├── create-user.dto.ts
│       │   └── update-user.dto.ts
│       ├── user.controller.ts
│       ├── user.controller.spec.ts
│       ├── user.entity.ts
│       ├── user.module.ts
│       ├── user.service.ts
│       └── user.service.spec.ts
├── app.module.ts
└── main.ts
```

## Security Features

- **Password Hashing**: Passwords are automatically hashed using bcrypt before storage
- **Input Validation**: All inputs are validated using class-validator
- **Whitelist Validation**: Non-whitelisted properties are rejected
- **Soft Delete**: Users are soft-deleted, preventing permanent data loss
- **Email Uniqueness**: Duplicate email addresses are prevented at the database level

## Health Checks

The Docker setup includes health checks for all services:

- **Server**: HTTP health check on `/users` endpoint
- **MySQL**: mysqladmin ping
- **Redis**: redis-cli ping

## Caching Strategy

- **findOne**: Individual user records are cached by ID
- **findAll**: Paginated user lists are cached by query parameters
- **Cache Invalidation**: Cache is cleared on create, update, and delete operations
- **TTL**: Default cache TTL is 5 minutes (configurable via `CACHE_TTL`)

## Error Handling

The application provides meaningful error messages for:

- **404 Not Found**: User doesn't exist
- **409 Conflict**: Duplicate email address
- **400 Bad Request**: Invalid input data
- **500 Internal Server Error**: Unexpected errors

## Code Quality

- **ESLint**: Configured for code linting
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Single Responsibility**: Each function has a focused purpose
- **Feature-based Architecture**: Organized by domain features

## CI/CD Ready

The project is structured for easy CI/CD integration:

- Dockerfile for building production images
- docker-compose.yml for orchestration
- Comprehensive test suite
- Environment variable configuration
- Health check endpoints

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Docker Documentation](https://docs.docker.com)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the UNLICENSED license.
