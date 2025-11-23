import express from "express";
import { getStats, getTopOffenders, getAutoClosedLogs, getDashboardHistory, getRuleImpact } from "../controllers/dashboardController.js";
import { authorize, protect } from "../middlewares/auth.js";

const router = express.Router();

router.get("/stats", protect, getStats);
router.get("/top-offenders", protect, getTopOffenders);
router.get("/auto-closed", protect, getAutoClosedLogs);
router.get("/history", protect, getDashboardHistory); 
router.get("/rule-impact", protect, authorize('admin'), getRuleImpact);


export default router;