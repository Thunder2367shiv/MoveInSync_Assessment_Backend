import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    unique: true,
    default: () => Date.now().toString()
  },
  sourceType: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ["INFO", "WARNING", "CRITICAL"],
    default: "INFO"
  },
  status: {
    type: String,
    enum: ["OPEN", "ESCALATED", "AUTO-CLOSED", "RESOLVED"],
    default: "OPEN"
  },
  driverId: {
    type: String,
    required: true,
    index: true
  },
  metadata: {
    type: Object
  },
  autoCloseReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

alertSchema.index({
  status: 1,
  createdAt: 1
});

const Alert = mongoose.model("Alert", alertSchema);
export default Alert;