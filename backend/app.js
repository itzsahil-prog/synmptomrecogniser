require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');

const authRoutes = require('./src/routes/auth');
const symptomRoutes = require('./src/routes/symptoms');
const conditionRoutes = require('./src/routes/conditions');
const analysisRoutes = require('./src/routes/analysis');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/symptoms', symptomRoutes);
app.use('/api/conditions', conditionRoutes);
app.use('/api/analysis', analysisRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
