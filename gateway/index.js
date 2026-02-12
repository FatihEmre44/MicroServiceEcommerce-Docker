const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Logging Middleware
app.use(morgan('combined'));

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'API Gateway',
        timestamp: new Date()
    });
});

// Proxy Routes
// Auth Service
app.use('/api/auth', createProxyMiddleware({
    target: 'http://auth-service:3001',
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '/api/auth' // Keep the path as is, or adjust if needed by the target service
    }
}));

// Product Service
app.use('/api/products', createProxyMiddleware({
    target: 'http://product-service:3002',
    changeOrigin: true
}));

// Order Service
app.use('/api/orders', createProxyMiddleware({
    target: 'http://order-service:3003',
    changeOrigin: true
}));

// Search Service
app.use('/api/search', createProxyMiddleware({
    target: 'http://search-service:3004',
    changeOrigin: true
}));

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
});