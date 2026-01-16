const express = require('express');
const Condition = require('../models/Condition');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all conditions
router.get('/', async (req, res) => {
  try {
    const conditions = await Condition.find().populate('symptoms', 'name').sort({ name: 1 });
    res.json(conditions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new condition (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { name, symptoms, urgency, description, advice } = req.body;

    if (!name || !symptoms || !urgency || !description || !advice) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const condition = new Condition({
      name,
      symptoms,
      urgency,
      description,
      advice,
      createdBy: req.user._id
    });

    await condition.save();
    await condition.populate('symptoms', 'name');
    res.status(201).json(condition);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Condition already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Update condition (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { name, symptoms, urgency, description, advice } = req.body;
    const condition = await Condition.findByIdAndUpdate(
      req.params.id,
      { name, symptoms, urgency, description, advice },
      { new: true, runValidators: true }
    ).populate('symptoms', 'name');

    if (!condition) {
      return res.status(404).json({ error: 'Condition not found' });
    }

    res.json(condition);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete condition (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const condition = await Condition.findByIdAndDelete(req.params.id);

    if (!condition) {
      return res.status(404).json({ error: 'Condition not found' });
    }

    res.json({ message: 'Condition deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
