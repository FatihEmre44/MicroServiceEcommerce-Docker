# Quick Start Guide

## Starting the Application

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and start all services
docker compose up --build

# Or run in detached mode
docker compose up -d --build

# Check service status
docker compose ps

# View logs
docker compose logs -f
```

### Option 2: Local Development

1. Start Redis:
```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or use local Redis installation
redis-server
```

2. Start each service in separate terminals:
```bash
# Terminal 1 - Product Service
cd product-service
npm install
npm start

# Terminal 2 - Order Service
cd order-service
npm install
npm start

# Terminal 3 - User Service
cd user-service
npm install
npm start

# Terminal 4 - API Gateway
cd api-gateway
npm install
npm start
```

## Testing the API

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "john@example.com",
      "name": "John Doe"
    },
    "token": "jwt-token-here"
  }
}
```

### 3. Get All Products

```bash
curl http://localhost:3000/api/products
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "product-uuid-1",
      "name": "Laptop",
      "description": "High-performance laptop",
      "price": 999.99,
      "category": "Electronics",
      "stock": 10
    }
  ]
}
```

### 4. Create a Product

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse",
    "price": 29.99,
    "category": "Accessories",
    "stock": 100
  }'
```

### 5. Create an Order

```bash
# Use the user ID from registration and product ID from products list
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "user-id: <user-uuid>" \
  -d '{
    "items": [
      {
        "productId": "<product-uuid>",
        "quantity": 2
      }
    ]
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "userId": "user-uuid",
    "items": [
      {
        "productId": "product-uuid",
        "productName": "Laptop",
        "price": 999.99,
        "quantity": 2,
        "subtotal": 1999.98
      }
    ],
    "totalAmount": 1999.98,
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6. Get User Orders

```bash
curl http://localhost:3000/api/orders \
  -H "user-id: <user-uuid>"
```

## Stopping the Application

### Docker Compose:
```bash
docker compose down

# Remove volumes as well
docker compose down -v
```

### Local Development:
Press `Ctrl+C` in each terminal running a service.

## Troubleshooting

### Services can't connect to Redis
- Make sure Redis is running
- Check REDIS_URL environment variable
- Verify Redis is accessible on port 6379

### API Gateway can't reach services
- Verify all services are running
- Check service URLs in environment variables
- Ensure services are on the same Docker network (when using Docker)

### Port already in use
```bash
# Find and kill process using a port
lsof -ti:3000 | xargs kill -9

# Or use different ports in .env files
```
