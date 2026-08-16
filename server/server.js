import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import kpiRoutes from './routes/kpi.js';
import copilotRoutes from './routes/copilot.js';

// Resolve directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the workspace root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
// Allow all origins temporarily with a comment to restrict it later.
// To lock this down in production, define ALLOWED_ORIGINS (e.g. https://your-app.vercel.app) in your environment variables.
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : '*';

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Routes
app.use('/api/kpi', kpiRoutes);
app.use('/api/copilot', copilotRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    aiMode: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here' ? 'Live Gemini API' : 'Mock AI Mode'
  });
});

// Serve frontend static assets in production
const distPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(distPath));

// Fallback to React index.html for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('MFGX AI API Server. (Frontend build not detected; run in development mode or run build command).');
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
