import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    // ── NEW: every application belongs to exactly one user ──────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    resume: {
      type: String,
      required: true,
    },
    analysis: {
      matchScore: { type: Number, min: 0, max: 100 },
      matchLabel: {
        type: String,
        enum: ['Poor', 'Fair', 'Good', 'Strong', 'Excellent'],
      },
      summary: { type: String },
      tailoredBullets: { type: [String] },
      coverLetter: { type: String },
      missingKeywords: { type: [String] },
      strengths: { type: [String] },
    },
    research: {
      companyOverview: { type: String },
      recentNews: { type: [String] },
      culture: { type: String },
      interviewQuestions: [
        {
          question: { type: String },
          tip: { type: String },
        },
      ],
      talkingPoints: { type: [String] },
    },
    status: {
      type: String,
      enum: ['analyzed', 'applied', 'interviewing', 'offered', 'rejected'],
      default: 'analyzed',
    },
  },
  { timestamps: true }
);

const Application = mongoose.model('Application', applicationSchema);
export default Application;