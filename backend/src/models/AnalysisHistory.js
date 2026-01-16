const mongoose = require('mongoose');

const analysisHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Symptom',
    required: true
  }],
  results: [{
    condition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Condition'
    },
    matchScore: {
      type: Number,
      required: true
    },
    matchingSymptoms: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Symptom'
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AnalysisHistory', analysisHistorySchema);
