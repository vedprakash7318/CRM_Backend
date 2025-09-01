import LeadStatus from "../models/leadStatus.model.js";

export const addLeadStatus = async (req, res) => {
    try {   
        const addedBy = req.params.id;
        const { statusText ,userType} = req.body;
        if (!statusText || !addedBy) {
            return res.status(404).json({
                message: "lead StatusText  and addedBy are required !.",
                success: false
            })
        }
        const newLeadStatus = await LeadStatus.create({
            leadStatusText: statusText,
            addedBy,
            addedByType: userType === "Employee" ? "Employee" : "Admin"
        });
        return res.status(201).json({
            message: "Lead status added successfully !",
            newLeadStatus,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server Error at the time of Adding leadStatus!.",
            success: false
        })
    }
}
export const getAllLeadStatus = async (req, res) => {
    try {
        const addedBy = req.params.id;
        const leadStatus = await LeadStatus.find({ addedBy: addedBy }).populate("addedBy");
        if (!leadStatus) {
            return res.status(404).json({
                message: "leadStatus Not Found !.",
                success: false
            })
        }

        return res.status(201).json({
            message: "These are the registered Lead status !",
            leadStatus,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server Error at the time of fetching all leadStatus!.",
            success: false
        })
    }
}
export const getLeadStatusById = async (req, res) => {
    try {
        const addedBy = req.params.id;
        const { leadStatusId } = req.body;
        if (!addedBy || !addedBy) {
            return res.status(404).json({
                message: " leadStatusId  and addedBy are required !.",
                success: false
            })
        }
        const leadStatus = await LeadStatus.findOne({ _id: leadStatusId, addedBy: addedBy });
        if (!leadStatus) {
            return res.status(404).json({
                message: "leadStatus Not Found !.",
                success: false
            })
        }

        return res.status(201).json({
            message: "This is the registered Lead status !",
            leadStatus,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server Error at the time of fetching single leadStatus!.",
            success: false
        })
    }
}
export const updateLeadStatus = async (req, res) => {
    try {
        const addedBy = req.params.id;
        const { statusText, leadStatusId } = req.body;
        if (!statusText || !addedBy) {
            return res.status(404).json({
                message: "lead StatusText  and addedBy are required !.",
                success: false
            })
        }
        const leadStatus = await LeadStatus.findOne({ _id: leadStatusId, addedBy: addedBy });
        if (!leadStatus) {
            return res.status(404).json({
                message: "leadStatus Not Found !.",
                success: false
            })
        }

        // updating status
        leadStatus.leadStatusText = statusText;
        leadStatus.save();
        return res.status(201).json({
            message: "Lead status Updated Successfully!",
            leadStatus,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server Error at the time of Updating leadStatus!.",
            success: false
        })
    }
}

export const deleteLeadStatus = async (req, res) => {
    try {
        const  leadStatusId  = req.params.id;
        console.log(leadStatusId);  
        
        if (!leadStatusId) {
            return res.status(404).json({
                message: " leadStatusId are required !.",
                success: false
            })
        }
        const deletedLeadStatus = await LeadStatus.findByIdAndDelete(leadStatusId);
        if (!deletedLeadStatus) {
            return res.status(404).json({
                message: "leadStatus Not Found !.",
                success: false
            })
        }

        return res.status(201).json({
            message: "Lead status Deleted successfully !",
            deletedLeadStatus,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server Error at the time of Deletion of leadStatus!.",
            success: false
        })
    }
}