import jwt from 'jsonwebtoken';

// ── protect ──────────────────────────────────────────────────────
// Any route that uses this middleware will only run its controller
// if the request includes a valid, unexpired JWT. Otherwise it stops
// the request here with a 401 — the controller never even runs.
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Expected format: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Throws if the token is invalid, tampered with, or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user id to the request so every controller
    // downstream can use req.userId without re-verifying anything
    req.userId = decoded.userId;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid. Please log in again.',
    });
  }
};