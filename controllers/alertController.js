import ruleEngine from "../services/RuleEngine.js";
import Rule from "../models/Rule.js";
import Alert from "../models/Alert.js";
import Driver from '../models/Driver.js';
import SystemStat from '../models/SystemStat.js';

export const createAlert = async (req, res, next) => {
  try {
    const alert = await ruleEngine.processAlert(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

export const triggerEvent = async (req, res, next) => {
  try {
    const { driverId, eventType } = req.body;
    await ruleEngine.processEvent(driverId, eventType);
    res.status(200).json({ success: true, message: "Event processed" });
  } catch (error) {
    next(error);
  }
};

export const seedRules = async (req, res, next) => {
  try {
    await Rule.deleteMany({});

    const rules = [
      {
        type: "OVERSPEED",
        escalate_if_count: 3,
        window_mins: 60
      },
      {
        type: "DOCUMENT",
        auto_close_trigger: "DOCUMENT_RENEWAL"
      },
      {
        type: "FEEDBACK_NEGATIVE",
        escalate_if_count: 2,
        window_mins: 1440
      }
    ];

    await Rule.insertMany(rules);
    res.json({ success: true, message: "Rules created! You can now test escalation." });
  } catch (error) {
    next(error);
  }
};

export const getAlertById = async (req, res, next) => {
  try {
    const alert = await Alert.findOne({ alertId: req.params.id });
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }
    res.json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

export const getRules = async (req, res, next) => {
  try {
    const rules = await Rule.find({});
    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

export const getRecentAlerts = async (req, res, next) => {
  try {
    const alerts = await Alert.find({
      status: {$nin: ["AUTO-CLOSED", "RESOLVED"]}
    })
      .sort({ updatedAt: -1 })
      .limit(20);
    res.json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
};

export const manualResolve = async (req, res, next) => {
  try {
    const alert = await Alert.findOne({ alertId: req.params.id });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    if (alert.status === 'RESOLVED' || alert.status === 'AUTO-CLOSED') {
      return res.status(400).json({ message: 'Alert is already closed' });
    }

    const oldSeverity = alert.severity;

    alert.status = 'RESOLVED';
    alert.autoCloseReason = `Manual Resolution by ${req.user.name}`;
    alert.updatedAt = Date.now();
    await alert.save();

    await Driver.updateOne(
      { driverId: alert.driverId },
      { $inc: { activeAlertCount: -1 } }
    );

    const updateOps = { autoClosedCount: 1 };

    if (oldSeverity === 'CRITICAL') updateOps.totalCritical = -1;
    if (oldSeverity === 'WARNING') updateOps.totalWarning = -1;
    if (oldSeverity === 'INFO') updateOps.totalInfo = -1;

    await SystemStat.updateOne(
      { singletonId: 'dashboard_stats' },
      { $inc: updateOps }
    );

    res.json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

export const syncStats = async (req, res, next) => {
  try {

    const critical = await Alert.countDocuments({ severity: 'CRITICAL', status: { $in: ['OPEN', 'ESCALATED'] } });
    const warning = await Alert.countDocuments({ severity: 'WARNING', status: 'OPEN' });
    const info = await Alert.countDocuments({ severity: 'INFO', status: 'OPEN' });
    const closed = await Alert.countDocuments({ status: { $in: ['AUTO-CLOSED', 'RESOLVED'] } });

    await SystemStat.findOneAndUpdate(
      { singletonId: 'dashboard_stats' },
      {
        totalCritical: critical,
        totalWarning: warning,
        totalInfo: info,
        autoClosedCount: closed
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Stats Synchronized Successfully" });
  } catch (error) {
    next(error);
  }
};


export const updateRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { escalate_if_count, window_mins } = req.body;

    const rule = await Rule.findByIdAndUpdate(
      id, 
      { escalate_if_count, window_mins },
      { new: true } 
    );

    if (!rule) return res.status(404).json({ message: "Rule not found" });

    res.json({ success: true, data: rule, message: "Rule updated successfully" });
  } catch (error) {
    next(error);
  }
};