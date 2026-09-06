const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' })); // 10mb for base64 attachments
app.use(cors());

// ─── MongoDB Connection for Serverless & Long-running ──────────────
let isConnected = false;
const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState === 1) {
        isConnected = true;
        return;
    }
    try {
        const db = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kanban_workspace', {
            serverSelectionTimeoutMS: 8000,
            bufferCommands: false
        });
        isConnected = db.connections[0].readyState === 1;
        console.log('✅ MongoDB Connected Successfully');
    } catch (err) {
        console.error('❌ Database connection error:', err);
    }
};

// Middleware to ensure DB is connected before processing any API route
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('DB middleware error:', err);
        res.status(500).json({ error: 'Database connection failed. Please check MongoDB Atlas connection.' });
    }
});

// ─── Routes ───────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/tasks',    require('./routes/taskRoutes'));
app.use('/api/requests', require('./routes/pendingRequestRoutes'));

// ─── Welcome / Root Route ──────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        message: 'Workspace Manager API is running successfully!',
        status: 'online',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting/disconnected',
        endpoints: {
            auth: '/api/auth',
            tasks: '/api/tasks',
            requests: '/api/requests',
            health: '/api/health'
        }
    });
});

// ─── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// ─── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`   Auth     → http://localhost:${PORT}/api/auth`);
        console.log(`   Tasks    → http://localhost:${PORT}/api/tasks`);
        console.log(`   Requests → http://localhost:${PORT}/api/requests`);
        console.log(`   Health   → http://localhost:${PORT}/api/health`);
    });
}

module.exports = app;