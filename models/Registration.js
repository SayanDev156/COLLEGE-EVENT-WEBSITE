const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    college: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, enum: ["tech", "cultural", "career", "gaming"] },
    message: { type: String, default: "", trim: true },
    termsAccepted: { type: Boolean, required: true },
    reminderSentAt: { type: Date, default: null }
  },
  { timestamps: true }
);

registrationSchema.index({ email: 1 }, { unique: true });
registrationSchema.index({ phone: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);
