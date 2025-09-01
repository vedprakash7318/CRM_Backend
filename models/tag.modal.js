import mongoose from "mongoose";

const tagSchema = mongoose.Schema({
    tagName:{
        type:String,
        required:true,
        trim:true,
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "addedByType", 
        required: true,
      },
      addedByType: {
        type: String,
        required: true,
        enum: ["Admin", "Employee"], 
      },
},{timestamps:true});

const Tag = new mongoose.model("Tag", tagSchema);
export default Tag;