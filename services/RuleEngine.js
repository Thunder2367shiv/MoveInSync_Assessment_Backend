import Alert from '../models/Alert.js';
import Driver from '../models/Driver.js';
import SystemStat from '../models/SystemStat.js';
import Rule from '../models/Rule.js';

class RuleEngine {
  async initStats() {
    const exists = await SystemStat.findOne({ singletonId: 'dashboard_stats' });
    if (!exists) {
      console.log("Creating initial System Stats");
      await SystemStat.create({});
    }
  }

async processAlert(data) {
  const rule = await Rule.findOne({ type: data.sourceType });

  let severity = data.severity || 'INFO';
  let status = 'OPEN';

  if (rule && rule.escalate_if_count) {
    const timeLimit = new Date(Date.now() - rule.window_mins * 60000);

    const recentCount = await Alert.countDocuments({
      driverId: data.metadata.driverId,
      sourceType: data.sourceType,
      createdAt: { $gte: timeLimit }
    });

    const totalCount = recentCount + 1;

    if (totalCount >= rule.escalate_if_count) {
      severity = 'CRITICAL';
      status = 'ESCALATED';
    } else if (totalCount === rule.escalate_if_count - 1) {
      severity = 'WARNING';
    }
  }

  const oldestAlert = await Alert.findOne({
    driverId: data.metadata.driverId,
    sourceType: data.sourceType
  }).sort({ createdAt: 1 });

  let createdAtValue = new Date();
  if (oldestAlert) {
    createdAtValue = oldestAlert.createdAt; 
  }

  const newAlert = await Alert.create({
    ...data,
    severity,
    status,
    driverId: data.metadata.driverId,
    createdAt: createdAtValue  
  });

  await this.updateCounters(severity, 1);

  await Driver.findOneAndUpdate(
    { driverId: data.metadata.driverId, name: data.metadata.driverName },
    { $inc: { activeAlertCount: 1 } },
    { upsert: true, new: true }
  );

  return newAlert;
}


  async processEvent(driverId, eventType) {
    const rule = await Rule.findOne({ auto_close_trigger: eventType });
    if (!rule) return; 

    const alertsToClose = await Alert.find({
      driverId,
      sourceType: rule.type,
      status: { $in: ['OPEN', 'ESCALATED'] }
    });

    for (let alert of alertsToClose) {
      await this.closeAlert(alert, `Event: ${eventType}`);
    }
  }

  async closeAlert(alert, reason) {
    const oldSeverity = alert.severity;

    alert.status = 'AUTO-CLOSED';
    alert.autoCloseReason = reason;
    alert.updatedAt = new Date();
    await alert.save();

    await this.updateCounters(oldSeverity, -1);
    await SystemStat.updateOne({ singletonId: 'dashboard_stats' }, { $inc: { autoClosedCount: 1 } });
    
    await Driver.updateOne(
      { driverId: alert.driverId },
      { $inc: { activeAlertCount: -1 } }
    );
  }

  async updateCounters(severity, delta) {
    const update = {};
    const sev = severity ? severity.toUpperCase() : 'INFO';

    if (sev === 'CRITICAL') update.totalCritical = delta;
    else if (sev === 'WARNING') update.totalWarning = delta;
    else if (sev === 'INFO') update.totalInfo = delta;
    
    if (Object.keys(update).length > 0) {
      await SystemStat.findOneAndUpdate(
        { singletonId: 'dashboard_stats' }, 
        { $inc: update },
        { upsert: true, new: true }
      );
    }
  }
}

export default new RuleEngine();