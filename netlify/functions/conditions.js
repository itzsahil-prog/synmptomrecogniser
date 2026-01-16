const mongoose = require('mongoose');
const Condition = require('../../backend/src/models/Condition');
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

const getUserFromToken = (event) => {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
};

exports.handler = async (event, context) => {
  await connectDB();

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      const conditions = await Condition.find().populate('symptoms', 'name').sort({ name: 1 });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(conditions),
      };
    }

    if (event.httpMethod === 'POST') {
      const user = getUserFromToken(event);
      if (!user || user.role !== 'admin') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Admin access required' }),
        };
      }

      const { name, symptoms, urgency, description, advice } = JSON.parse(event.body);

      if (!name || !symptoms || !urgency || !description || !advice) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'All fields are required' }),
        };
      }

      const condition = new Condition({
        name,
        symptoms,
        urgency,
        description,
        advice,
        createdBy: user.userId
      });

      await condition.save();
      await condition.populate('symptoms', 'name');

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(condition),
      };
    }

    if (event.httpMethod === 'PUT' && event.path.includes('/')) {
      const user = getUserFromToken(event);
      if (!user || user.role !== 'admin') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Admin access required' }),
        };
      }

      const id = event.path.split('/').pop();
      const { name, symptoms, urgency, description, advice } = JSON.parse(event.body);

      const condition = await Condition.findByIdAndUpdate(
        id,
        { name, symptoms, urgency, description, advice },
        { new: true, runValidators: true }
      ).populate('symptoms', 'name');

      if (!condition) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Condition not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(condition),
      };
    }

    if (event.httpMethod === 'DELETE' && event.path.includes('/')) {
      const user = getUserFromToken(event);
      if (!user || user.role !== 'admin') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Admin access required' }),
        };
      }

      const id = event.path.split('/').pop();
      const condition = await Condition.findByIdAndDelete(id);

      if (!condition) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Condition not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Condition deleted successfully' }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Condition already exists' }),
      };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error' }),
    };
  }
};
