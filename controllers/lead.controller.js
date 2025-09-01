import Admin from "../models/admin.model.js";
import Employee from "../models/employee.model.js";
import Lead from "../models/lead.model.js";
import mongoose  from "mongoose";

export const addLead = async (req, res) => {
    try {
      const addedBy = req.params.id;
      const { name, phone, priority, sources, userType, leadAssignedTo, tags } = req.body;
      if (!phone) {
        return res.status(400).json({
          message: "phone is a required field!",
          success: false
        });
      }
      
      let isExistAddedBy = await Admin.findOne({ _id: addedBy }) || await Employee.findOne({ _id: addedBy });
      if (!isExistAddedBy) {
        return res.status(400).json({
          message: "Invalid addedBy Id !",
          success: false,
        });
      }
      
      const newLead = await Lead.create({
        name: name,
        phone: phone,
        priority: priority,
        sources: sources,
        tags: tags || [], 
        addedBy,
        leadAssignedTo: leadAssignedTo,
        addedByType: userType === "Employee" ? "Employee" : "Admin"
      });
      
      return res.status(201).json({
        message: "Lead Added Successfully!",
        lead: newLead,
        success: true
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || "Internal Server Error! at the time of adding lead.",
        success: false
      });
    }
  }
export const addManyLead = async (req, res) => {
    
    try {
        const addedBy = req.params.id;
        const { leadsArray, userType} = req.body; // Leads is an array
        // console.log(leadsArray, "id: ", addedBy, "user", userType);
        // Validate input
        if (!leadsArray || !Array.isArray(leadsArray) || leadsArray.length === 0) {
            return res.status(400).json({
                message: "Leads array is required and cannot be empty!",
                success: false,
            });
        }
        
        const leads = [];
       

        
        const existingPhones = await Lead.find({ phone: { $in: leadsArray.map(lead => lead.phone) } }).select("phone");
        
        const existingPhonesSet = new Set(existingPhones.map(lead => lead.phone));

        
        for (const lead of leadsArray) {
            if (!lead.phone) {
                return res.status(400).json({ // Changed 404 to 400 (bad request)
                    message: "Each lead must have a phone field!",
                    success: false
                });
            }

            if (!existingPhonesSet.has(lead.phone)) {
                // Create a new object to avoid modifying the original reference
                leads.push({
                    ...lead,
                    addedBy,
                    addedByType: userType
                });
            }
        }

        // If no new leads to insert
        if (leads.length === 0) {
            return res.status(200).json({
                message: "No new leads to add!",
                success: true
            });
        }

        // console.log("New Leads to Insert:", leads);

        // Insert new leads in bulk
        const insertedNewLeads = await Lead.insertMany(leads);

        return res.status(201).json({
            message: "Lead(s) Added Successfully!",
            leads: insertedNewLeads,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error! at the time of adding leads in bulk.",
            success: false
        });
    }
};

export const getAllDeletedLeads = async (req, res) => {
    try {
        const addedBy = req.params.id;
        const leads = await Lead.find({ addedBy: addedBy, deleted: true })
            .populate('leadAssignedTo')
            .populate('leadStatus')
            .populate("priority")
            .populate("sources")
            .populate("tags");

        if (!leads || leads.length === 0) {
            return res.status(404).json({
                message: "No deleted leads found.",
                success: false
            });
        }

        return res.status(200).json({
            message: "Deleted leads fetched successfully!",
            success: true,
            leads
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error while fetching deleted leads",
            success: false
        });
    }
};



export const getAllLeads = async (req, res) => {
    try {
        const addedBy = req.params.id;
        
        const { leadAssignedTo, tags } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Base query
        const baseQuery = { 
            addedBy,
            deleted: false
        };

        // Optional filters
        if (leadAssignedTo && leadAssignedTo !== 'null') {
            baseQuery.leadAssignedTo = leadAssignedTo;
        }

        if (tags && tags !== 'null') {
            const tagIds = Array.isArray(tags) ? tags : tags.split(',');
            baseQuery.tags = { $all: tagIds };
        }

        // Fetch paginated leads and count
        const [leads, totalLeads] = await Promise.all([
            Lead.find(baseQuery)
                .skip(skip)
                .limit(limit)
                .populate('leadAssignedTo')
                .populate('leadStatus')
                .populate('priority')
                .populate('sources')
                .populate('tags'),
            Lead.countDocuments(baseQuery)
        ]);
        
        // Fetch additional statistics
        const [
            totalAssignedLeads,
            totalUnassignedLeads,
            totalClosedLeads,
            totalNegativeLeads
        ] = await Promise.all([
            Lead.countDocuments({ addedBy, deleted: false, leadAssignedTo: { $ne: null } }),
            Lead.countDocuments({ addedBy, deleted: false, leadAssignedTo: null }),
            Lead.countDocuments({ addedBy, deleted: false, closed: true }),
            Lead.countDocuments({ addedBy, deleted: false, negative: true })
        ]);

        const totalPages = Math.ceil(totalLeads / limit);

        return res.status(200).json({
            success: true,
            leads,
            totalLeads,
            totalPages,
            currentPage: page,
            totalAssignedLeads,
            totalUnassignedLeads,
            totalClosedLeads,
            totalNegativeLeads
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch leads",
            error: error.message
        });
    }
};


// GET /api/leads/search?query=keyword
export const searchLeads = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ success: false, message: "Query is required" });
    }

    const leads = await Lead.find({
      deleted: false,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('leadAssignedTo')
      .populate('leadStatus')
      .populate('priority')
      .populate('sources')
      .populate('tags');

    return res.status(200).json({ success: true, leads });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Search failed", error: error.message });
  }
};


// export const getAssignedLeads = async (req, res) => {
//     try {
//         const addedBy = req.params.id;
//         const leads = await Lead.find({
//             addedBy: addedBy,
//             leadAssignedTo: { $ne: null }
//         })
//             .populate('leadAssignedTo')
//             .populate('leadStatus')
//             .populate('priority')
//             .populate('sources')
//             .populate('tags');

//         if (leads.length === 0) {
//             return res.status(404).json({
//                 message: "No assigned leads found for this user.",
//                 success: false
//             });
//         }

//         return res.status(200).json({
//             message: "Assigned leads fetched successfully!",
//             success: true,
//             leads
//         });
//     } catch (error) {
//         return res.status(500).json({
//             message: error.message || "Internal Server Error while fetching assigned leads",
//             success: false
//         });
//     }
// };


export const getAssignedLeads = async (req, res) => {
    try {
        const addedBy = req.params.id;
        const { leadAssignedTo, tags } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Base query: addedBy and leadAssignedTo is not null
        const query = {
            addedBy: addedBy,
            leadAssignedTo: { $ne: null },
            deleted: false
        };

        // Optional filter: specific assignee
        if (leadAssignedTo && leadAssignedTo !== 'null') {
            query.leadAssignedTo = leadAssignedTo;
        }

        // Optional filter: tags (must include all)
        if (tags && tags !== 'null') {
            const tagIds = Array.isArray(tags) ? tags : tags.split(',');
            query.tags = { $all: tagIds };
        }

        const [leads, totalLeads] = await Promise.all([
            Lead.find(query)
                .skip(skip)
                .limit(limit)
                .populate('leadAssignedTo')
                .populate('leadStatus')
                .populate('priority')
                .populate('sources')
                .populate('tags'),
            Lead.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalLeads / limit);

        return res.status(200).json({
            message: "Assigned leads fetched successfully!",
            success: true,
            leads,
            totalLeads,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error while fetching assigned leads",
            success: false
        });
    }
};



// export const getUnassignedLeads = async (req, res) => {
//     try {
//         const addedBy = req.params.id;
//         const leads = await Lead.find({
//             addedBy: addedBy,
//             leadAssignedTo: null
//         })
//             .populate('leadAssignedTo')
//             .populate('leadStatus')
//             .populate('priority')
//             .populate('sources')
//             .populate('tags');

//         if (leads.length === 0) {
//             return res.status(404).json({
//                 message: "No unassigned leads found for this user.",
//                 success: false
//             });
//         }

//         return res.status(200).json({
//             message: "Unassigned leads fetched successfully!",
//             success: true,
//             leads
//         });
//     } catch (error) {
//         return res.status(500).json({
//             message: error.message || "Internal Server Error while fetching unassigned leads",
//             success: false
//         });
//     }
// };


// export const employeesAllLeads = async (req, res) => {
//     try {
//         const leadAssignedTo = req.params.id;
//         const leads = await Lead.find({leadAssignedTo:leadAssignedTo})
//         .populate('leadAssignedTo')
//         .populate('leadStatus')
//         .populate("priority")
//         .populate("sources")
//         .populate("tags")
//         if (!leads) {
//             return res.status(404).json({
//                 message: "Leads Not Found!, Not registered any lead yet.",
//                 success: false
//             });
//         }
//         return res.status(201).json({
//             message: "These are the registered leads !",
//             success: true,
//             leads
//         });
//     } catch (error) {
//         return res.status(500).json({
//             message: error.message || "Internal Server Error!, at the time of fetching all leads",
//             success: false
//         });
//     }
// }





// export const getLeadById = async (req, res) => {
//     try {
//         const addedBy = req.params.id;
//         const {leadId} = req.body;
//         if (!leadId) {
//             return res.status(404).json({
//                 message: "Lead Id not Found",
//                 success: false
//             })
//         }
//         const lead = await Lead.findOne({ _id: leadId, addedBy:addedBy });
//         if (!lead) {
//             return res.status(404).json({
//                 message: "Leads Not Found!",
//                 success: false
//             });
//         }
//         return res.status(200).json({
//             message: "These are the registered leads !",
//             lead,
//             success: true
//         });
//     } catch (error) {
//         return res.status(500).json({
//             message: error.message || "Internal Server Error!, at the time of fetching lead By id",
//             success: false
//         });
//     }
// }




export const getUnassignedLeads = async (req, res) => {
    try {
        const addedBy = req.params.id;
        const { tags } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Base query: addedBy and unassigned leads
        const query = {
            addedBy: addedBy,
            leadAssignedTo: null,
            deleted: false
        };

        // Optional filter: tags (must include all)
        if (tags && tags !== 'null') {
            const tagIds = Array.isArray(tags) ? tags : tags.split(',');
            query.tags = { $all: tagIds };
        }

        const [leads, totalLeads] = await Promise.all([
            Lead.find(query)
                .skip(skip)
                .limit(limit)
                .populate('leadAssignedTo')
                .populate('leadStatus')
                .populate('priority')
                .populate('sources')
                .populate('tags'),
            Lead.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalLeads / limit);

        return res.status(200).json({
            message: "Unassigned leads fetched successfully!",
            success: true,
            leads,
            totalLeads,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error while fetching unassigned leads",
            success: false
        });
    }
};



export const employeesAllLeads = async (req, res) => {
    try {
        const leadAssignedTo = req.params.id;

        const leads = await Lead.aggregate([
            {
                $match: {
                    leadAssignedTo: new mongoose.Types.ObjectId(leadAssignedTo)
                }
            },
            {
                $lookup: {
                    from: "followups",
                    let: { leadId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$leadId", "$$leadId"]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 },
                        // Populate followupStatus
                        {
                            $lookup: {
                                from: "followupstatuses",
                                localField: "followupStatus",
                                foreignField: "_id",
                                as: "followupStatus"
                            }
                        },
                        { $unwind: { path: "$followupStatus", preserveNullAndEmptyArrays: true } },
                        // Populate priority
                        {
                            $lookup: {
                                from: "priorities",
                                localField: "priority",
                                foreignField: "_id",
                                as: "priority"
                            }
                        },
                        { $unwind: { path: "$priority", preserveNullAndEmptyArrays: true } },
                        // Populate followedBy
                        {
                            $lookup: {
                                from: "users",
                                localField: "followedBy",
                                foreignField: "_id",
                                as: "followedBy"
                            }
                        },
                        { $unwind: { path: "$followedBy", preserveNullAndEmptyArrays: true } }
                    ],
                    as: "latestFollowup"
                }
            },
            // Optional: populate lead fields like priority, sources, etc.
            {
                $lookup: {
                    from: "leadstatuses",
                    localField: "leadStatus",
                    foreignField: "_id",
                    as: "leadStatus"
                }
            },
            { $unwind: { path: "$leadStatus", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "priorities",
                    localField: "priority",
                    foreignField: "_id",
                    as: "priority"
                }
            },
            { $unwind: { path: "$priority", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "leadsources", // Make sure this matches your MongoDB collection name
                    localField: "sources",
                    foreignField: "_id",
                    as: "sources"
                }
            },
            { $unwind: { path: "$sources", preserveNullAndEmptyArrays: true } },            
            {
                $lookup: {
                    from: "tags",
                    localField: "tags",
                    foreignField: "_id",
                    as: "tags"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "leadAssignedTo",
                    foreignField: "_id",
                    as: "leadAssignedTo"
                }
            },
            { $unwind: { path: "$leadAssignedTo", preserveNullAndEmptyArrays: true } }
        ]);

        if (!leads || leads.length === 0) {
            return res.status(404).json({
                message: "Leads Not Found!, Not registered any lead yet.",
                success: false
            });
        }

        return res.status(200).json({
            message: "These are the registered leads!",
            success: true,
            leads
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error!, at the time of fetching all leads",
            success: false
        });
    }
}



export const getPendingLeadsByEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const leads = await Lead.aggregate([
      {
        $match: {
          leadAssignedTo: new mongoose.Types.ObjectId(employeeId),
          closed: false,
          deleted: false,
          negative: false,
        },
      },
      {
        $lookup: {
          from: 'followups',
          let: { leadId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$leadId', '$$leadId'] },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }, // Get latest follow-up only
          ],
          as: 'latestFollowup',
        },
      },

      // 🔍 FILTER: Exclude if latest follow-up is by the same employee
      {
        $match: {
          $or: [
            { latestFollowup: { $eq: [] } }, // No follow-up exists — include
            {
              'latestFollowup.0.followedBy': {
                $ne: new mongoose.Types.ObjectId(employeeId), // Latest follow-up NOT by same employee — include
              },
            },
          ],
        },
      },

      // Populate leadStatus
      {
        $lookup: {
          from: 'leadstatuses',
          localField: 'leadStatus',
          foreignField: '_id',
          as: 'leadStatus',
        },
      },
      { $unwind: { path: '$leadStatus', preserveNullAndEmptyArrays: true } },

      // Populate priority
      {
        $lookup: {
          from: 'priorities',
          localField: 'priority',
          foreignField: '_id',
          as: 'priority',
        },
      },
      { $unwind: { path: '$priority', preserveNullAndEmptyArrays: true } },

      // Populate sources
      {
        $lookup: {
          from: 'leadsources',
          localField: 'sources',
          foreignField: '_id',
          as: 'sources',
        },
      },
      { $unwind: { path: '$sources', preserveNullAndEmptyArrays: true } },

      // Populate tags
      {
        $lookup: {
          from: 'tags',
          localField: 'tags',
          foreignField: '_id',
          as: 'tags',
        },
      },

      // Populate assigned user
      {
        $lookup: {
          from: 'users',
          localField: 'leadAssignedTo',
          foreignField: '_id',
          as: 'leadAssignedTo',
        },
      },
      { $unwind: { path: '$leadAssignedTo', preserveNullAndEmptyArrays: true } },
    ]);

    if (!leads || leads.length === 0) {
      return res.status(404).json({
        message: 'No pending leads found!',
        success: false,
      });
    }

    return res.status(200).json({
      message: 'Fetched pending leads successfully!',
      success: true,
      leads,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Internal Server Error, while fetching pending leads',
      success: false,
    });
  }
};




export const deleteLead = async (req, res) => {
    try {
        const leadId = req.params.id;
        if (!leadId) {
            return res.status(404).json({
                message: "Lead Id not Found",
                success: false
            })
        }
        await Lead.findByIdAndUpdate({_id:leadId}, {$set:{deleted:true}});
        return res.status(200).json({
            message: "Lead Deleted Successfully!",
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error!, at the time of Deleting lead",
            success: false
        })
    }

}
export const restoreLead = async (req, res) => {
    try {
        const leadId = req.params.id;
        // const {leadId} = req.body;
        if (!leadId) {
            return res.status(404).json({
                message: "Lead Id not Found",
                success: false
            })
        }
        await Lead.findByIdAndUpdate({_id:leadId}, {$set:{deleted:false}});
        return res.status(200).json({
            message: "Lead Restored Successfully!",
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error!, at the time of restoring lead",
            success: false
        })
    }

}


export const assignLead = async (req, res) => {
    try {
      const { leadIds, employeeIds } = req.body;
  
      if (
        !leadIds || 
        !Array.isArray(leadIds) || 
        leadIds.length === 0 || 
        !employeeIds || 
        !Array.isArray(employeeIds) || 
        employeeIds.length === 0
      ) {
        return res.status(400).json({
          message: "Lead IDs array and Employee IDs array are required!",
          success: false,
        });
      }
  
      // Check if all leads exist
      const leads = await Lead.find({ _id: { $in: leadIds } });
      if (leads.length !== leadIds.length) {
        return res.status(404).json({
          message: "One or more leads not found",
          success: false,
        });
      }
  
      // Check if all employees exist
      const employees = await Employee.find({ _id: { $in: employeeIds } });
      if (employees.length !== employeeIds.length) {
        return res.status(404).json({
          message: "One or more employees not found",
          success: false,
        });
      }
  
      // Update each lead
      const updatedLeads = [];
      for (const leadId of leadIds) {
        const updatedLead = await Lead.findByIdAndUpdate(
          leadId,
          { $set: { leadAssignedTo: employeeIds } },
          { new: true }
        );
        updatedLeads.push(updatedLead);
      }
  
      return res.status(200).json({
        message: "Employees assigned to all leads successfully",
        updatedLeads,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || "Internal Server Error! Error assigning employees to leads",
        success: false,
      });
    }
  };


  export const unassignLeads = async (req, res) => {
    try {
      const { leadIds, employeeIdsToRemove } = req.body;
  
      // Validation
      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({
          message: "Lead IDs array is required!",
          success: false,
        });
      }
  
      if (!Array.isArray(employeeIdsToRemove) || employeeIdsToRemove.length === 0) {
        return res.status(400).json({
          message: "Employee IDs to remove are required!",
          success: false,
        });
      }
  
      // Fetch leads
      const leads = await Lead.find({ _id: { $in: leadIds } });
      if (leads.length !== leadIds.length) {
        return res.status(404).json({
          message: "One or more leads not found",
          success: false,
        });
      }
  
      const updatedLeads = [];
  
      for (const lead of leads) {
        const currentAssigned = lead.leadAssignedTo || [];
  
        // Filter out employees to remove
        const updatedAssigned = currentAssigned.filter(
          (empId) => !employeeIdsToRemove.includes(empId.toString())
        );
  
        // If no employees left, set to null
        lead.leadAssignedTo = updatedAssigned.length > 0 ? updatedAssigned : null;
  
        const updatedLead = await lead.save();
        updatedLeads.push(updatedLead);
      }
  
      return res.status(200).json({
        message: "Selected employees have been unassigned from the leads successfully",
        updatedLeads,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || "Internal Server Error! Error unassigning employees",
        success: false,
      });
    }
  };
  

  


export const updateLead = async(req,res)=>{
    try {
        const leadId = req.params.id;
        const { name,phone, priority,sources, email, gender, dob, country, state, city, zipCode, leadStatus,tags} = req.body;
        const lead = await Lead.findOne({_id:leadId})
        
        if(!lead){
            return res.status(404).json({message:" id not found",success:false})
        }
        if(name) lead.name = name ;
        if(phone) lead.phone = phone ;
        if(priority) lead.priority = priority;
        if(email) lead.email = email;
        if(gender) lead.gender = gender;
        if(dob) lead.dob = dob;
        if(sources) lead.sources = sources;
        if(country) lead.country = country;
        if(state) lead.state = state;
        if(city) lead.city = city;
        if(zipCode) lead.zipCode = zipCode;
        if(leadStatus) lead.leadStatus = leadStatus;
        if(tags) lead.tags = tags
        await  lead.save();
        return res.status(201).json({
            message: "Lead Updated Successfully!",
            lead,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error!, at the time of Updating lead!.",
            success: false
        });
    }
}

export const closedLead = async (req, res) => {
    try {
        const leadId = req.params.id;
        // const {leadId} = req.body;
        if (!leadId) {
            return res.status(404).json({
                message: "Lead Id not Found",
                success: false
            })
        }
        await Lead.findByIdAndUpdate({_id:leadId}, {$set:{closed:true}});
        return res.status(200).json({
            message: "Lead Closed Successfully!",
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error!, at the time of Closing lead",
            success: false
        })
    }

}

export const UnclosedLead = async (req, res) => {
    try {
        const leadId = req.params.id;
        if (!leadId) {
            return res.status(404).json({
                message: "Lead Id not Found",
                success: false
            })
        }
        await Lead.findByIdAndUpdate({_id:leadId}, {$set:{closed:false}});
        return res.status(200).json({
            message: "Lead Unclosed Successfully!",
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error!, at the time of Unclosing lead",
            success: false
        })
    }

}

export const negativedLead = async (req, res) => {
    try {
        const leadId = req.params.id;
        // const {leadId} = req.body;
        if (!leadId) {
            return res.status(404).json({
                message: "Lead Id not Found",
                success: false
            })
        }
        await Lead.findByIdAndUpdate({_id:leadId}, {$set:{negative:true}});
        return res.status(200).json({
            message: "Mark as Negative Successfully!",
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error!, at the time of marks as Negative lead",
            success: false
        })
    }

}
export const UnnegativedLead = async (req, res) => {
    try {
        const leadId = req.params.id;
        // const {leadId} = req.body;
        if (!leadId) {
            return res.status(404).json({
                message: "Lead Id not Found",
                success: false
            })
        }
        await Lead.findByIdAndUpdate({_id:leadId}, {$set:{negative:false}});
        return res.status(200).json({
            message: "Mark as Negative Successfully!",
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error!, at the time of marks as Negative lead",
            success: false
        })
    }

}