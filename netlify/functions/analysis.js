const mongoose = require('mongoose');
const Condition = require('../../backend/src/models/Condition');
const AnalysisHistory = require('../../backend/src/models/AnalysisHistory');
const jwt = require('jsonwebtoken');

// Database connection
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

exports.handler = async (event, context) => {
  await connectDB();

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'POST' && event.path.endsWith('/analyze')) {
      const { symptoms } = JSON.parse(event.body);

      if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Please provide a list of symptoms' }),
        };
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

      // Check for auth token
      const authHeader = event.headers.authorization;
      let user = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (decoded) {
          user = decoded;
        }
      }

      // If user is authenticated, save to history
      if (user) {
        const historyEntry = new AnalysisHistory({
          user: user.userId,
          symptoms: symptoms,
          results: matchingConditions.slice(0, 5) // Save top 5 results
        });
        await historyEntry.save();
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(matchingConditions),
      };
    }

    if (event.httpMethod === 'GET' && event.path.includes('/history')) {
      const authHeader = event.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'No token provided' }),
        };
      }

      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (!decoded) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid token' }),
        };
      }

      const history = await AnalysisHistory.find({ user: decoded.userId })
        .populate('user', 'username')
        .sort({ createdAt: -1 })
        .limit(50);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(history),
      };
    }

    if (event.httpMethod === 'DELETE' && event.path.includes('/history/')) {
      const authHeader = event.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'No token provided' }),
        };
      }

      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (!decoded) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid token' }),
        };
      }

      const id = event.path.split('/').pop();
      const entry = await AnalysisHistory.findOneAndDelete({
        _id: id,
        user: decoded.userId
      });

      if (!entry) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'History entry not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'History entry deleted successfully' }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error' }),
    };
  }
};
