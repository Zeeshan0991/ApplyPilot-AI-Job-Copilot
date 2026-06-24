import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, resume: user.resume },
        token,
      },
    });

  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Something went wrong during registration.',
      error: error.message,
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, resume: user.resume },
        token,
      },
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Something went wrong during login.',
      error: error.message,
    });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      // NEW: resume now included so AuthContext always has the latest copy
      data: { id: user._id, name: user.name, email: user.email, resume: user.resume },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not fetch user.' });
  }
};

// PATCH /api/auth/resume — NEW
// Saves or updates the user's resume text, tied to their account.
export const updateResume = async (req, res) => {
  try {
    const { resume } = req.body;

    if (typeof resume !== 'string') {
      return res.status(400).json({ success: false, message: 'Resume must be text.' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { resume },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, resume: user.resume },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not save resume.',
      error: error.message,
    });
  }
};