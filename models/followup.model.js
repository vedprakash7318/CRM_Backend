import mongoose from "mongoose";

const followupSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead", 
      required: true,
    },
  
    followupStatus: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"LeadStatus"
    },
    priority:{
      type: mongoose.Schema.Types.ObjectId,
      ref:"Priority"
    },
    followedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required:true
    },
    followupMessage: {
      type: String,
      trim: true,
      required:true
    },
    nextFollowupDate: {   
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Followup = new mongoose.model("Followup", followupSchema);

export default Followup
