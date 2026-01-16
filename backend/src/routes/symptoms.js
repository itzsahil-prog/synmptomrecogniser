const express = require('express');
const Symptom = require('../models/Symptom');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all symptoms
router.get('/', async (req, res) => {
  try {
    const symptoms = await Symptom.find().sort({ name: 1 });
    res.json(symptoms);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new symptom (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Symptom name is required' });
    }

    const symptom = new Symptom({
      name,
      description,
      createdBy: req.user._id
    });

    await symptom.save();
    res.status(201).json(symptom);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Symptom already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Update symptom (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const symptom = await Symptom.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!symptom) {
      return res.status(404).json({ error: 'Symptom not found' });
    }

    res.json(symptom);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete symptom (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const symptom = await Symptom.findByIdAndDelete(req.params.id);

    if (!symptom) {
      return res.status(404).json({ error: 'Symptom not found' });
    }

    res.json({ message: 'Symptom deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
