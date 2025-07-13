import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import * as middleware from 'i18next-http-middleware';
import { errorHandler } from '@/middleware/errorHandler';
import { notFound } from '@/middleware/notFound';
import { authRoutes } from '@/routes/auth';
import { userRoutes } from '@/routes/users';
import { storeRoutes } from '@/routes/stores';
import { productRoutes } from '@/routes/products';
import { saleRoutes } from '@/routes/sales';
import { debtRoutes } from '@/routes/debts';
import { stockRoutes } from '@/routes/stock';
import { statsRoutes } from '@/routes/stats';
import { syncRoutes } from '@/routes/sync';
import { setupSocketIO } from '@/services/socketService';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize i18next
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    lng: 'fr',
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en', 'rn', 'sw'],
    backend: {
      loadPath: './src/locales/{{lng}}/{{ns}}.json'
    },
    detection: {
      order: ['header', 'querystring'],
      caches: false
    }
  });

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(middleware.handle(i18next));

// Setup Socket.IO
setupSocketIO(io);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/sync', syncRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 VukaNet Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌍 Languages: French, English, Kirundi, Kiswahili`);
});

export { app, io };