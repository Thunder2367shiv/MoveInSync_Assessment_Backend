import cron from "node-cron";
import Alert from "../models/Alert.js";
import ruleEngine from "./RuleEngine.js";

const startScheduler = () => {
  cron.schedule("*/5 * * * *", async () => {
    console.log("Auto-Close Background Job...");
    
    try {
      const timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const expiredAlerts = await Alert.find({
        status: { $in: ["OPEN", "ESCALATED"] },
        createdAt: { $lt: timeLimit }
      });

      for(const alert of expiredAlerts) {
        await ruleEngine.closeAlert(alert, "Time window expired (24h)");
        console.log("Auto-closed alert: ", alert.alertId);
      }
    } catch (err) {
      console.error("Job Failed:", err.message);
    }
  });
};

export default startScheduler;