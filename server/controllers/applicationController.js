import Application from '../models/Application.js';
import { analyzeApplication, researchCompany } from '../config/aiService.js';

// Maps internal error codes (thrown from aiService.js) to honest,
// specific messages the frontend can show directly to the user —
// no more generic "something went wrong" for every failure type.
function describeAIError(error) {
  switch (error.message) {
    case 'AI_PROVIDER_ERROR':
      return {
        status: 503,
        message: 'The AI service is temporarily unavailable or rate-limited. Please wait a moment and try again.',
      };
    case 'AI_MALFORMED_RESPONSE':
      return {
        status: 502,
        message: 'The AI returned an unexpected response after multiple attempts. This sometimes happens with free-tier models under load — please try again.',
      };
    case 'AI_AGENT_INCOMPLETE':
      return {
        status: 502,
        message: 'The research agent could not complete its search within the allowed steps. Please try running research again.',
      };
    default:
      return {
        status: 500,
        message: 'Something went wrong. Please try again.',
      };
  }
}

// POST /api/applications/analyze
export const analyze = async (req, res) => {
  try {
    const { resume, jobDescription, jobTitle, company } = req.body;

    if (!resume || !jobDescription || !jobTitle || !company) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resume, jobDescription, jobTitle, and company.',
      });
    }

    const analysis = await analyzeApplication(resume, jobDescription, jobTitle, company);

    const application = await Application.create({
      user: req.userId,
      jobTitle,
      company,
      jobDescription,
      resume,
      analysis,
    });

    res.status(201).json({ success: true, data: application });

  } catch (error) {
    console.error('Analysis error:', error.message, error.cause?.message || '');
    const { status, message } = describeAIError(error);
    res.status(status).json({ success: false, message, errorCode: error.message });
  }
};

// GET /api/applications
export const getApplications = async (req, res) => {
  try {
    const applications = await Application.find({ user: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not fetch applications.' });
  }
};

// GET /api/applications/:id
export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findOne({ _id: id, user: req.userId });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    res.status(200).json({ success: true, data: application });

  } catch (error) {
    res.status(404).json({ success: false, message: 'Application not found.' });
  }
};

// POST /api/applications/:id/research
export const research = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findOne({ _id: id, user: req.userId });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const researchData = await researchCompany(
      application.company,
      application.jobTitle,
      application.resume
    );

    application.research = researchData;
    await application.save();

    res.status(200).json({ success: true, data: application });

  } catch (error) {
    console.error('Research error:', error.message, error.cause?.message || '');
    const { status, message } = describeAIError(error);
    res.status(status).json({ success: false, message, errorCode: error.message });
  }
};

// PATCH /api/applications/:id/status
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['analyzed', 'applied', 'interviewing', 'offered', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const application = await Application.findOneAndUpdate(
      { _id: id, user: req.userId },
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    res.status(200).json({ success: true, data: application });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not update status.',
      error: error.message,
    });
  }
};

// PATCH /api/applications/:id/content
export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { tailoredBullets, coverLetter } = req.body;

    const update = {};
    if (Array.isArray(tailoredBullets)) {
      update['analysis.tailoredBullets'] = tailoredBullets;
    }
    if (typeof coverLetter === 'string') {
      update['analysis.coverLetter'] = coverLetter;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nothing to update — provide tailoredBullets and/or coverLetter.',
      });
    }

    const application = await Application.findOneAndUpdate(
      { _id: id, user: req.userId },
      { $set: update },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    res.status(200).json({ success: true, data: application });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not save your changes.',
      error: error.message,
    });
  }
};

// DELETE /api/applications/:id
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findOneAndDelete({ _id: id, user: req.userId });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    res.status(200).json({ success: true, message: 'Application deleted successfully.' });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not delete application.',
      error: error.message,
    });
  }
};