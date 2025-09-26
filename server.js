const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./src/routes/authRoutes');
const itemRoutes = require('./src/routes/itemroutes');

// Note: Ensure you are using a Prisma Singleton pattern
// to avoid connection pooling issues in Vercel Serverless Functions.
// Import the singleton instance here if needed elsewhere, 
// but do NOT instantiate or call $connect() here.
// const prisma = require('./src/config/prisma'); 

const app = express();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('Created uploads directory.');
}

// --- CORS OPTIONS ---
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL, // Deployed frontend's URL
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allows requests if the origin is in the allowed list, or if the origin is undefined (e.g., local server-to-server calls or some postman tests)
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
// --- END OF CORS SECTION ---

// 1. Remove the problematic app.options('*', ...) line.
// 2. The global app.use(cors(corsOptions)) handles the preflight requests automatically.
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// Vercel serverless functions do not need app.listen to connect to a port.
// However, the listen call is kept for local development compatibility.
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT} (local mode).`);
  // NOTE: Remove explicit Prisma $connect() here if you are using the singleton pattern.
  // The connection should happen lazily on the first request in a serverless environment.
});

// IMPORTANT: For Vercel to treat this as a serverless function, 
// you must export the app. The 'vercel.json' file ensures this is handled.
module.exports = app; 
