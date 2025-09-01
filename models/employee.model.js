import mongoose from "mongoose";

const employeeSchema = mongoose.Schema({
    empName:{
        type:String,
        required:true,
        trim:true
    },
    empPhoneNumber:{
        type:String,
        required:true,  
        unique:true,
        trim:true
    },
    empEmail:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    empPassword:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    empGender:{
        type:String,
        trim:true
    },
    empDOB:{
        type:String,
        trim:true
    },
    empDesignation:{
        type:String,
        trim:true
    },
    empCity:{
        type:String,
        trim:true
    },
    empState:{
        type:String,
        trim:true
    },
    empCountry:{
        type:String,
        trim:true
    },
    empZipCode:{
        type:String,
        trim:true
    },
    blocked:{
        type:Boolean,
        required:true,
        default:false
    },
    addedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Admin",
        required:true
    }
},{timestamps:true});

const Employee = new mongoose.model("Employee", employeeSchema);
export default Employee;