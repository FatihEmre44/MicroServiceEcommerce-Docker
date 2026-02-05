# E-Commerce Microservices Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                   (Web/Mobile Applications)                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      API GATEWAY (Port 3000)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  - Request Routing                                         │ │
│  │  - Rate Limiting                                           │ │
│  │  - Response Caching (Redis)                                │ │
│  │  - Load Balancing                                          │ │
│  │  - Authentication Validation                               │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────┬────────────────────┬────────────────────┬───────────────┘
        │                    │                    │
        │                    │                    │
┌───────▼──────────┐ ┌──────▼───────────┐ ┌──────▼───────────┐
│  PRODUCT SERVICE │ │  ORDER SERVICE   │ │  USER SERVICE    │
│   (Port 3001)    │ │   (Port 3002)    │ │   (Port 3003)    │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ - Product CRUD   │ │ - Order Creation │ │ - User Register  │
│ - Inventory Mgmt │ │ - Order Status   │ │ - Authentication │
│ - Categories     │ │ - Order History  │ │ - JWT Tokens     │
│ - Stock Updates  │ │ - Cart Logic     │ │ - Profile Mgmt   │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   REDIS (Port 6379) │
                    ├────────────────────┤
                    │ - Product Data     │
                    │ - Order Data       │
                    │ - User Data        │
                    │ - Session Cache    │
                    │ - Response Cache   │
                    └────────────────────┘
```

## Service Communication Flow

### 1. User Registration Flow
```
Client → API Gateway → User Service → Redis
                                       ↓
Client ← API Gateway ← User Service ← Redis
```

### 2. Product Listing Flow (with caching)
```
Client → API Gateway → Check Redis Cache
                       ↓ (cache miss)
                       Product Service → Redis
                       ↓
Client ← API Gateway ← Product Service
         ↓
         Store in Cache
```

### 3. Order Creation Flow
```
Client → API Gateway → Order Service
                       ↓
                       1. Validate Products (→ Product Service)
                       2. Check Stock
                       3. Create Order
                       4. Update Stock (→ Product Service)
                       5. Store Order (→ Redis)
                       ↓
Client ← API Gateway ← Order Service
```

## Technology Stack

### Backend Services
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: JavaScript

### Data & Caching
- **Database/Cache**: Redis 7
- **Session Store**: Redis
- **Response Cache**: Redis

### Authentication & Security
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Rate Limiting**: express-rate-limit

### Containerization
- **Container Runtime**: Docker
- **Orchestration**: Docker Compose

### Service Communication
- **Protocol**: HTTP/REST
- **Client**: Axios
- **Data Format**: JSON

## Data Models

### User Model (Redis)
```
Key: user:{userId}
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "password": "hashed_password",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}

Additional Keys:
- user:email:{email} → userId (index)
- users:all → Set of all userIds
- session:{token} → session data
```

### Product Model (Redis)
```
Key: product:{productId}
{
  "id": "uuid",
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "category": "Category",
  "stock": 100,
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}

Additional Keys:
- products:all → Set of all productIds
```

### Order Model (Redis)
```
Key: order:{orderId}
{
  "id": "uuid",
  "userId": "user_uuid",
  "items": [
    {
      "productId": "product_uuid",
      "productName": "Product",
      "price": 99.99,
      "quantity": 2,
      "subtotal": 199.98
    }
  ],
  "totalAmount": 199.98,
  "status": "pending|processing|shipped|delivered|cancelled",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}

Additional Keys:
- user:{userId}:orders → Set of orderIds for user
- orders:all → Set of all orderIds
```

## API Endpoints Summary

### User Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/users/register | Register new user |
| POST | /api/users/login | User login |
| GET | /api/users/:id | Get user profile |
| PUT | /api/users/:id | Update user profile |
| POST | /api/users/logout | User logout |
| POST | /api/users/verify | Verify JWT token |

### Product Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | Get all products |
| GET | /api/products/:id | Get product by ID |
| POST | /api/products | Create new product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| PATCH | /api/products/:id/stock | Update stock |

### Order Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/orders | Get user orders |
| GET | /api/orders/:id | Get order by ID |
| POST | /api/orders | Create new order |
| PATCH | /api/orders/:id/status | Update order status |
| DELETE | /api/orders/:id | Cancel order |

## Port Configuration

| Service | Port | Internal Port |
|---------|------|---------------|
| API Gateway | 3000 | 3000 |
| Product Service | 3001 | 3001 |
| Order Service | 3002 | 3002 |
| User Service | 3003 | 3003 |
| Redis | 6379 | 6379 |

## Environment Variables

### API Gateway
```env
PORT=3000
REDIS_URL=redis://redis:6379
PRODUCT_SERVICE_URL=http://product-service:3001
ORDER_SERVICE_URL=http://order-service:3002
USER_SERVICE_URL=http://user-service:3003
```

### Product Service
```env
PORT=3001
REDIS_URL=redis://redis:6379
```

### Order Service
```env
PORT=3002
REDIS_URL=redis://redis:6379
PRODUCT_SERVICE_URL=http://product-service:3001
```

### User Service
```env
PORT=3003
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key
```

## Scalability Considerations

### Current Architecture Benefits
- **Horizontal Scaling**: Each service can be scaled independently
- **Load Distribution**: API Gateway distributes requests
- **Caching**: Redis reduces database load
- **Isolation**: Service failures don't cascade

### Future Improvements
1. **Message Queue**: Add RabbitMQ/Kafka for async operations
2. **Database**: Add PostgreSQL/MongoDB for persistent storage
3. **Service Discovery**: Implement service registry (Consul/Eureka)
4. **API Documentation**: Add Swagger/OpenAPI
5. **Monitoring**: Add Prometheus + Grafana
6. **Logging**: Centralized logging with ELK Stack
7. **Circuit Breaker**: Add resilience patterns
8. **API Versioning**: Support multiple API versions

## Security Features

1. **Password Security**: Bcrypt hashing with salt
2. **JWT Authentication**: Stateless authentication
3. **Session Management**: Redis-based session store
4. **Rate Limiting**: Prevent API abuse
5. **Environment Variables**: Sensitive data protection
6. **CORS**: Cross-origin request handling
7. **Input Validation**: Request validation

## Performance Optimization

1. **Response Caching**: Redis cache for GET requests
2. **Connection Pooling**: Efficient Redis connections
3. **Async Operations**: Non-blocking I/O
4. **Minimal Dependencies**: Lightweight services
5. **Docker Optimization**: Multi-stage builds (production)
