const express = require('express');
const Condition = require('../models/Condition');
const AnalysisHistory = require('../models/AnalysisHistory');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Analyze symptoms
router.post('/analyze', async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ error: 'Please provide a list of symptoms' });
    }

    const conditions = await Condition.find().populate('symptoms', 'name');

    const matchingConditions = conditions.map(condition => {
      const matchingSymptoms = symptoms.filter(s => 
        condition.symptoms.some(symptom => symptom._id.toString() === s)
      );
      const matchScore = matchingSymptoms.length / condition.symptoms.length;

      return {
        ...condition.toObject(),
        matchingSymptomCount: matchingSymptoms.length,
        matchScore: matchScore,
        matchingSymptoms: matchingSymptoms
      };
    }).filter(c => c.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

    // If user is authenticated, save to history
    if (req.user) {
      const historyEntry = new AnalysisHistory({
        user: req.user._id,
        symptoms: symptoms,
        results: matchingConditions.slice(0, 5) // Save top 5 results
      });
      await historyEntry.save();
    }

    res.json(matchingConditions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's analysis history
router.get('/history', auth, async (req, res) => {
  try {
    const history = await AnalysisHistory.find({ user: req.user._id })
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete history entry
router.delete('/history/:id', auth, async (req, res) => {
  try {
    const entry = await AnalysisHistory.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!entry) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    res.json({ message: 'History entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
