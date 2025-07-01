const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const pool = require('../db');
const ensureAdmin = require('../middleware/ensureAdmin');

// ✅ Multer Setup for Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ File Upload Route for Question Images
router.post('/upload', ensureAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const filePath = `/uploads/${req.file.filename}`;

  return res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    fileName: req.file.filename,
    filePath: filePath, // This is the URL your frontend can use (http://localhost:5000 + filePath)
  });
});

// ✅ Admin Test Route (Protected)
router.get('/', ensureAdmin, (req, res) => {
  res.send('✅ Admin route works and is protected.');
});

// ✅ Add individual question to a section (optional, if admin wants manual insert)
router.post('/add-question', ensureAdmin, async (req, res) => {
  const {
    test_id,
    section_id,
    question_image = null,
    question_type = 'MCQ',
    correct_option,
    options = [],
    positive_marks = 4,
    negative_marks = -1,
  } = req.body;

  if (!test_id || !section_id || !correct_option) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO questions 
        (test_id, section_id, question_image, question_type, correct_option, options, positive_marks, negative_marks) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        test_id,
        section_id,
        question_image,
        question_type,
        correct_option,
        JSON.stringify(options),
        positive_marks,
        negative_marks,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      question: result.rows[0],
    });
  } catch (err) {
    console.error('❌ Error adding question:', err);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

module.exports = router;
