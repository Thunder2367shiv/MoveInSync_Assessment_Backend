import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    unique: true 
  },
  escalate_if_count: { 
    type: Number 
  },
  window_mins: { 
    type: Number 
  },
  auto_close_trigger: { 
    type: String 
  }
});

const Rule = mongoose.model("Rule", ruleSchema);
export default Rule;