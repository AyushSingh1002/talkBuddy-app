import express from 'express';
import cors from 'cors';
import chatRoute from "./routes/chat.route.js"
import characterRoutes from "./routes/character.route.js";
import { initializeDatabase } from './database/init.js';
import { connectRedis } from './config/redis.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
  'exp://192.168.1.7:8081',
  process.env.FRONTEND_URL
].filter(Boolean); // removes undefined

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use( "/api/chat", chatRoute )
app.use( "/api/characters", characterRoutes )
// Routes
app.get('/', (req, res) => {
  res.json({ message: 'TalkBuddy API Server' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Initialize database, Redis, and start server
const startServer = async () => {
  try {
    // Initialize Redis first (non-blocking)
    await connectRedis();
    
    // Initialize database
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`⚡ Redis caching enabled for faster responses`);
    });
  } catch (error) {
    console.error('❌ Initialization failed, starting server in limited mode...');
    console.log('⚠️  Some features may not work without database/Redis connection');
    
    // Try to connect to Redis anyway
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (limited mode)`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log('💡 Make sure to set DATABASE_URL and REDIS_URL in your .env file');
    });
  }
};

startServer();

export default app;
