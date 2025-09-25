const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs'); // For file system operations (deleting a file if needed)

exports.createItem = async (req, res) => {
  const { itemType, itemName, description, location, contact } = req.body;
  const postedById = req.user.id;
  
  // Check for any file upload errors from Multer
  if (req.fileValidationError) {
      return res.status(400).json({ error: req.fileValidationError });
  }

  const imageURL = req.file ? `/uploads/${req.file.filename}` : null; 

  if (!itemType || !itemName || !description || !location || !contact) {
    if (req.file && req.file.path) {
        // Clean up the uploaded file if other required fields are missing
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
    }
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const newItem = await prisma.item.create({
      data: {
        itemType,
        itemName,
        description,
        location,
        contact,
        imageURL,
        postedById,
      },
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    // If the database operation fails, delete the uploaded file
    if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file after DB failure:', err);
        });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllItems = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: {
        postedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(items);
  } catch (error) {
    console.error('Get All Items Error:', error);
    res.status(500).json({ error: 'Failed to retrieve items.' });
  }
};

exports.getUserItems = async (req, res) => {
  const userId = req.user.id;
  try {
    const userItems = await prisma.item.findMany({
      where: { postedById: userId },
      include: {
        postedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(userItems);
  } catch (error) {
    console.error('Get User Items Error:', error);
    res.status(500).json({ error: 'Failed to retrieve your items.' });
  }
};

exports.getRecentItems = async (req, res) => {
  try {
    const recentItems = await prisma.item.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        postedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    res.status(200).json(recentItems);
  } catch (error) {
    console.error('Get Recent Items Error:', error);
    res.status(500).json({ error: 'Failed to retrieve recent items.' });
  }
};