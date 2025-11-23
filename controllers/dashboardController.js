import Driver from "../models/Driver.js";
import SystemStat from "../models/SystemStat.js";
import Alert from "../models/Alert.js";

export const getStats = async (req, res, next) => {
  try {
    const stats = await SystemStat.findOne({ singletonId: "dashboard_stats" });
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getTopOffenders = async (req, res, next) => {
  try {
    const drivers = await Driver.find()
      .sort({ activeAlertCount: -1 })
      .limit(5);
    res.json({ success: true, data: drivers });
  } catch (error) {
    next(error);
  }
};

export const getAutoClosedLogs = async (req, res, next) => {
  try {
    const logs = await Alert.find({
      status: { $in: ['AUTO-CLOSED', 'RESOLVED'] }
    })
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

export const getDashboardHistory = async (req, res, next) => {
  try {
    const { range } = req.query;

    let startDate = new Date();
    let dateFormat = "%Y-%m-%d";

    if (range === "12w") {
      startDate.setDate(startDate.getDate() - (12 * 7));
      dateFormat = "%Y-W%U";
    } else if (range === "30d") {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }

    const history = await Alert.aggregate([
      { $match: { createdAt: { $gte: startDate } } },

      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },

          total: { $sum: 1 },

          escalated: {
            $sum: { $cond: [{ $eq: ["$status", "ESCALATED"] }, 1, 0] }
          },

          autoclosed: {
            $sum: { $cond: [{ $eq: ["$status", "AUTO-CLOSED"] }, 1, 0] }
          }
        }
      },

      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

export const getRuleImpact = async (req, res, next) => {
  try {
    const ruleImpact = await Alert.aggregate([
      {
        $group: {
          _id: "$sourceType", 
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }  
    ]);

    res.json({ success: true, data: ruleImpact });

  } catch (err) {
    next(err);
  }
};

