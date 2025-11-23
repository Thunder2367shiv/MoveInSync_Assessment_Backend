import express from "express";
import { 
  createAlert, 
  triggerEvent, 
  seedRules, 
  getRules, 
  getAlertById, 
  getRecentAlerts, 
  manualResolve, 
  syncStats,
  updateRule,
} from "../controllers/alertController.js"; 
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.post("/ingest", protect, createAlert);
router.post("/event", protect, triggerEvent);
router.get('/recent', protect, getRecentAlerts);
router.post("/seed", protect, authorize('admin'), seedRules);
router.get("/rules", protect, authorize('admin'), getRules);     
router.post('/sync', protect, authorize('admin'), syncStats);
router.get("/:id", protect, getAlertById);  
router.put('/:id/resolve', protect, manualResolve);

router.put("/rules/:id", protect, authorize('admin'), updateRule);

export default router;