const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet'); // Güvenlik için
const cors = require('cors');     // CORS politikaları için

dotenv.config();

const app = express();

// Temel Middleware'ler
app.use(helmet());
app.use(cors());
app.use(express.json());

// MongoDB Bağlantısı
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/authdb';
mongoose.connect(MONGO_URI)
    .then(() => console.log(' MongoDB bağlantısı başarılı'))
    .catch(err => console.error(' MongoDB bağlantı hatası:', err));

// --- MİKROSERVİS EKLEMESİ: RabbitMQ ---
const { connectRabbit } = require('./message/producer');
connectRabbit(); // 5 deneme, 3s aralıkla

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Health check (Mikroservisler için çok önemli)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'auth-service', 
        timestamp: new Date() 
    });
});

// Global Hata Yönetimi Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Bir iç sunucu hatası oluştu!' });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
    console.log(` Auth Service ${PORT} portunda çalışıyor`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM sinyali alındı. Sunucu kapatılıyor.');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('MongoDB bağlantısı kapatıldı.');
            process.exit(0);
        });
    });
});