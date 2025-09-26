const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

// Your other exports (createItem, getRecentItems, getAllItems) remain the same...
exports.createItem = async (req, res) => {
  const { itemType, itemName, description, location, contact } = req.body;
  const postedById = req.user.id;
  
  if (req.fileValidationError) {
      return res.status(400).json({ error: req.fileValidationError });
  }

  const imageURL = req.file ? `/uploads/${req.file.filename}` : null; 

  if (!itemType || !itemName || !description || !location || !contact) {
    if (req.file && req.file.path) {
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
    if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file after DB failure:', err);
        });
    }
    res.status(500).json({ error: 'Server error' });
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

exports.getAllItems = async (req, res) => {
  const { skip, take } = req.query; 
  const parsedSkip = parseInt(skip, 10) || 0; 
  const parsedTake = parseInt(take, 10) || 3; 

  try {
    const items = await prisma.item.findMany({
      skip: parsedSkip,
      take: parsedTake,
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

    const totalItemsCount = await prisma.item.count(); 

    res.status(200).json({ 
        items,
        totalItemsCount
    });
  } catch (error) {
    console.error('Get All Items Error:', error);
    res.status(500).json({ error: 'Failed to retrieve items.' });
  }
};

// ** Modified `getUserItems` endpoint to handle pagination. **
exports.getUserItems = async (req, res) => {
  const userId = req.user.id;
  const { skip, take } = req.query; 
  const parsedSkip = parseInt(skip, 10) || 0;
  const parsedTake = parseInt(take, 10) || 3; // Default to 3 items per load

  try {
    const userItems = await prisma.item.findMany({
      skip: parsedSkip,
      take: parsedTake,
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
    
    // Get the total count of items for this specific user
    const totalUserItemsCount = await prisma.item.count({
      where: { postedById: userId },
    });
    
    res.status(200).json({
      items: userItems,
      totalItemsCount: totalUserItemsCount
    });
  } catch (error) {
    console.error('Get User Items Error:', error);
    res.status(500).json({ error: 'Failed to retrieve your items.' });
  }
};