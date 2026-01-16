const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  symptoms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Symptom',
    required: true
  }],
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Emergency'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  advice: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Condition', conditionSchema);
