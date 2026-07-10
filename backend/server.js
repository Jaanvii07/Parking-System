const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initializeDatabase } = require('./config/db');
const parkingRoutes = require('./routes/parkingRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend integration
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Routes
app.use('/api', parkingRoutes);

// Catch 404 routes and forward to error handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Centralized error handler
app.use(errorHandler);

// Initialize DB and start server
async function startServer() {
  try {
    // Run migrations/initialization
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server due to database initialization failure:', error);
    process.exit(1);
  }
}

startServer();
