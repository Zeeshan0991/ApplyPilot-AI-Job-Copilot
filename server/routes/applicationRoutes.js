import express from 'express';
import {
  analyze,
  getApplications,
  getApplicationById,
  research,
  updateStatus,
  updateContent,
  deleteApplication,
} from '../controllers/applicationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Every single applications route now requires a valid logged-in user.
// protect runs first on each line below — if it fails, the controller
// to its right never executes.
router.post('/analyze', protect, analyze);
router.get('/', protect, getApplications);
router.get('/:id', protect, getApplicationById);
router.post('/:id/research', protect, research);
router.patch('/:id/status', protect, updateStatus);
router.patch('/:id/content', protect, updateContent);
router.delete('/:id', protect, deleteApplication);

export default router;