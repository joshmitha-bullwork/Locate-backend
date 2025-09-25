// server.js
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // <--- ADD THIS LINE
const authRoutes = require('./src/routes/authRoutes');
const itemRoutes = require('./src/routes/itemroutes');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// --- ADD THIS SECTION ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('Created uploads directory.');
}
// --- END OF NEW SECTION ---

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir)); // Use the new variable here

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