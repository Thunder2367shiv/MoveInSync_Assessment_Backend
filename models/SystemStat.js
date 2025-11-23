import mongoose from "mongoose";

const systemStatSchema = new mongoose.Schema({
  singletonId: {
    type: String,
    default: "dashboard_stats",
    unique: true
  },
  totalCritical: {
    type: Number,
    default: 0
  },
  totalWarning: {
    type: Number,
    default: 0
  },
  totalInfo: {
    type: Number,
    default: 0
  },
  autoClosedCount: {
    type: Number,
    default: 0
  }
});

const SystemStat = mongoose.model("SystemStat", systemStatSchema);
export default SystemStat;