const express = require('express');
const router = express.Router();
const {
  createItem,
  getAllItems,
  getUserItems,
  getRecentItems,
} = require('../controllers/itemcontroller');
const { protect } = require('../middlewares/authMiddleware');

const multer = require('multer');
const path = require('path');

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Correct absolute path to the uploads folder
    // Go up one directory from 'routes' to 'src', then another to 'BACKEND',
    // and then specify 'uploads'.
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 
  },
  fileFilter: fileFilter
});

router.get('/', getAllItems);
router.post('/lost', protect, upload.single('image'), createItem);
router.post('/found', protect, upload.single('image'), createItem);
router.get('/my-items', protect, getUserItems);
router.get('/recent', getRecentItems);

module.exports = router;
