// server.js
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./src/routes/authRoutes');
const itemRoutes = require('./src/routes/itemroutes');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('Created uploads directory.');
}

// --- UPDATED CORS OPTIONS ---
// Allows requests from the deployed frontend and localhost during development.
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL, // This is your deployed frontend's URL
];

const corsOptions = {
  origin: (origin, callback) => {
    // Check if the request's origin is in the list of allowed origins
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
// --- END OF UPDATED SECTION ---

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log('Connected to MongoDB via Prisma!');
    console.log(`Server is running on port ${PORT}`);
  } catch (e) {
    console.error('Failed to connect to the database', e);
    process.exit(1);
  }
});