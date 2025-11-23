import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  driverId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  name: {
    type: String,
  },
  activeAlertCount: { 
    type: Number, 
    default: 0, 
    index: -1 
  }
});

const Driver = mongoose.model("Driver", driverSchema);
export default Driver;