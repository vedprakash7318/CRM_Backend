import Lead from "../models/lead.model.js";
import Followup from "../models/followup.model.js";
import Employee from "../models/employee.model.js";
import Admin from "../models/admin.model.js";

export const addEmployee = async (req, res) => {
    try {
        const addedBy = req.params.id;
        const {
            empName,
            empPhoneNumber,
            empEmail,
            empPassword,
            empGender,
            empDOB,
            empCity,
            empState,
            empZipCode,
            empCountry,
            empDesignation
        } = req.body;

        // Check for required fields
        if (
            !empName ||
            !empPhoneNumber ||
            !empEmail ||
            !empPassword 
        ) {
            return res.status(400).json({
                message: "All fields are required! Please provide all the details.",
                success: false,
            });
        }

        // Verify if addedBy exists in the Admin collection
        const isExistAddedBy = await Admin.findOne({ _id: addedBy });
        if (!isExistAddedBy) {
            return res.status(400).json({
                message: "Invalid addedBy ID!",
                success: false,
            });
        }

        // Check if the employee already exists
        const isExist = await Employee.findOne({
            $or: [{ empPhoneNumber }, { empEmail }],
        });
        if (isExist) {
            return res.status(400).json({
                message: "An employee already exists with this email or phone number!",
                employee: isExist,
                success: false,
            });
        }

        // Create a new employee
        const newEmployee = await Employee.create({
            empName,
            empPhoneNumber,
            empEmail,
            empPassword,
            empGender,
            empDOB,
            empDesignation,
            empCity,
            empZipCode,
            empCountry,
            empState,
            addedBy,
        });

        return res.status(201).json({
            message: "Employee added successfully!",
            employee: newEmployee,
            success: true,
        });
    } catch (error) {
        console.error("Error adding employee:", error);
        return res.status(500).json({
            message: error.message || "Internal server error at the time of adding employee.",
            success: false,
        });
    }
};

export const updateEmployee = async (req, res) => {
    try {
        const employeeId = req.params.id; 
        console.log("sidd",employeeId);
        
        const {
            empName,
            empPhoneNumber,
            empEmail,
            empPassword,
            empGender,
            empDOB,
            empDesignation,
            empCity,
            empState,
            empZipCode,
            empCountry,
            blocked,
        } = req.body; // Extract fields from the request body

        // Check if employeeId is valid and exists
        const isExistEmployee = await Employee.findById(employeeId);
        if (!isExistEmployee) {
            return res.status(404).json({
                message: "Employee not found! Invalid employeeId.",
                success: false,
            });
        }

        // Check for duplicate email or phone number if they are updated
        if (empPhoneNumber || empEmail) {
            const isDuplicate = await Employee.findOne({
                $or: [
                    { empPhoneNumber, _id: { $ne: employeeId } }, // Ensure phone doesn't belong to this employee
                    { empEmail, _id: { $ne: employeeId } }, // Ensure email doesn't belong to this employee
                ],
            });
            if (isDuplicate) {
                return res.status(400).json({
                    message: "An employee already exists with this email or phone number!",
                    success: false,
                });
            }
        }

        // Update employee details
        await Employee.findByIdAndUpdate(
            {_id:employeeId,empPassword},
            {
                empName,
                empPhoneNumber,
                empEmail,
                empGender,
                empDOB,
                empDesignation,
                empCity,
                empState,
                empCountry,
                empZipCode,
                blocked,
            },
            { new: true, runValidators: true } // Return updated document and run validation
        );

        if(!updateEmployee){
            return res.status(404).json({
                message: "Employee Not updated!",
                success: false,
            });
        }
        return res.status(200).json({
            message: "Employee updated successfully!",
            success: true,
        });
    } catch (error) {
        console.error("Error updating employee:", error);
        return res.status(500).json({
            message: error.message || "Internal server error while updating employee.",
            success: false,
        });
    }
};


export const loginEmployee = async (req,res)=>{
    try {
        const {username, password} = req.body;
        if(!username || !password){
            return res.status(400).json({
                message:"Please Provide username or password!",
                success:false
            })
        } 
        const isExistEmployee = await Employee.findOne({$or:[{empPhoneNumber:username},{empEmail:username}]});
        if(!isExistEmployee){
            return res.status(400).json({
                message:"Employee is not registered with this username!",
                employee:isExist,
                success:false
            })
        }
        if(isExistEmployee.empPassword !== password){
            return res.status(400).json({
                message:"Please Enter a valid Password!.",
                success:false
            })
        }
        if(isExistEmployee.blocked===true){
            return res.status(400).json({
                message:"You are blocked by your Admin ! Contact to Your Admin",
                success:false
            })
        }

        const isExistAdmin = await Admin.findById(isExistEmployee.addedBy);
        if(isExistAdmin.blocked === true){
            return res.status(400).json({
                message:"You are blocked by your Admin ! Contact to Your Admin",
                success:false
            })
        }
        return res.status(200).json({
            message:"You are Logedin Successfully!.",
            employee:isExistEmployee,
            success:true
        })
    } catch (error) {
        return res.status(500).json({
            message:error.message || "Internal server error!, at the time of employee login.",
            success:false
        })
    }
}

// export const getAllEmployees = async (req, res)=>{
//     try {
//         const addedBy = req.params.id;
//         const employees = await Employee.find({addedBy:addedBy});
//         if(!employees){
//             return res.status(404).json({
//                 message:"Employees are not found in Database!.",
//                 success:false
//             })
//         }
//         return res.status(200).json({
//             message:"these Emaployees are registered here.",
//             employees,
//             success:true
//         })
//     } catch (error) {
//         return res.status(500).json({
//             message:error.message || "Internal server error!, at the time of fetching employees .",
//             success:false
//         })        
//     }
// }

// Updated getAllEmployees function with pagination


export const getAllEmployees = async (req, res) => {
    try {
        const addedBy = req.params.id;
        
        // Pagination parameters from query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.rows) || 15;
        const skip = (page - 1) * limit;
        
        // Search parameter
        const searchQuery = req.query.search || '';
        
        // Build filter object for MongoDB query
        let filterQuery = { addedBy: addedBy, blocked: false }; // Exclude blocked employees
        
        // Add search functionality if search parameter is provided
        if (searchQuery) {
            filterQuery = {
                ...filterQuery,
                $or: [
                    { empName: { $regex: searchQuery, $options: 'i' } },
                    { empEmail: { $regex: searchQuery, $options: 'i' } },
                    { empPhoneNumber: { $regex: searchQuery, $options: 'i' } }
                ]
            };
        }
        
        // Get total count for pagination metadata
        const totalEmployees = await Employee.countDocuments(filterQuery);
        
        // Fetch employees with pagination
        const employees = await Employee.find(filterQuery)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // Sort by creation date, newest first
        
        if (!employees || employees.length === 0) {
            return res.status(200).json({
                message: "No employees found matching your criteria.",
                employees: [],
                pagination: {
                    page,
                    limit,
                    totalRecords: 0,
                    totalPages: 0
                },
                success: true
            });
        }
        
        return res.status(200).json({
            message: "Employees retrieved successfully.",
            employees,
            pagination: {
                page,
                limit,
                totalRecords: totalEmployees,
                totalPages: Math.ceil(totalEmployees / limit)
            },
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server error occurred while fetching employees.",
            success: false
        });
    }
};


export const getBlockedEmployees = async (req, res) => {
    try {
        const addedBy = req.params.id;

        // Pagination parameters from query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.rows) || 15;
        const skip = (page - 1) * limit;

        // Search parameter
        const searchQuery = req.query.search || '';

        // Build filter object for MongoDB query
        let filterQuery = { addedBy: addedBy, blocked: true }; // Only blocked employees

        // Add search functionality if search parameter is provided
        if (searchQuery) {
            filterQuery = {
                ...filterQuery,
                $or: [
                    { empName: { $regex: searchQuery, $options: 'i' } },
                    { empEmail: { $regex: searchQuery, $options: 'i' } },
                    { empPhoneNumber: { $regex: searchQuery, $options: 'i' } }
                ]
            };
        }

        // Get total count for pagination metadata
        const totalEmployees = await Employee.countDocuments(filterQuery);

        // Fetch employees with pagination
        const employees = await Employee.find(filterQuery)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        if (!employees || employees.length === 0) {
            return res.status(200).json({
                message: "No blocked employees found matching your criteria.",
                employees: [],
                pagination: {
                    page,
                    limit,
                    totalRecords: 0,
                    totalPages: 0
                },
                success: true
            });
        }

        return res.status(200).json({
            message: "Blocked employees retrieved successfully.",
            employees,
            pagination: {
                page,
                limit,
                totalRecords: totalEmployees,
                totalPages: Math.ceil(totalEmployees / limit)
            },
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server error occurred while fetching blocked employees.",
            success: false
        });
    }
};


export const getEmployeeById = async (req, res)=>{
    try {
        const addedBy = req.params.id;
        const {empId} = req.body;
        const employee = await Employee.findOne({_id:empId, addedBy:addedBy});
        if(!employee){
            return res.status(404).json({
                message:"Employee is not found in Database!.",
                success:false
            })
        }
        return res.status(200).json({
            message:"Emaployee Found.",
            employee,
            success:true
        })
    } catch (error) {
        return res.status(500).json({
            message:error.message || "Internal server error!, at the time of fetching employees .",
            success:false
        })        
    }
}

export const blockEmployee = async(req, res)=>{
    try {
        const addedBy = req.params.id;
        const {empId} = req.body;
        const blockedEmployee = await Employee.findByIdAndUpdate({_id:empId, addedBy:addedBy},{$set:{blocked:true}});
        if(!blockedEmployee){
            return res.status(404).json({
                message:"Employee is not found in Database!.",
                success:false
            })
        }
        return res.status(200).json({
            message:"Employee is blocked successfuly!",
            success:true
        })
        
    } catch (error) {
        return res.status(500).json({
            message:error.message || "Internal server error!, at the time of blocking of an employees .",
            success:false
        })       
    }
}

export const unBlockEmployee = async(req, res)=>{
    try {
        const addedBy = req.params.id;
        const {empId} = req.body;
        const unBlockedEmployee = await Employee.findByIdAndUpdate({_id:empId, addedBy:addedBy},{$set:{blocked:false}});
        if(!unBlockedEmployee){
            return res.status(404).json({
                message:"Employee is not found in Database!.",
                success:false
            })
        }
        return res.status(200).json({
            message:"Employee is unBlocked successfuly!",  
            success:true
        })
    } catch (error) {
        return res.status(500).json({
            message:error.message || "Internal erver error!, at the time of unBlocking of an employees .",
            success:false
        })       
    }
}



export const getEmployeeWorkStats = async (req, res) => {
  try {
    const { date, addedBy } = req.query;
    
    // Use today's date if no date provided
    const targetDate = date ? new Date(date) : new Date();
    
    // Set start and end of the target date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get all active employees
    const employees = await Employee.find({ blocked: false, addedBy:addedBy })
      .select('empName empEmail empDesignation')
      .lean();
    
    if (!employees.length) {
      return res.status(404).json({
        success: false,
        message: "No active employees found"
      });
    }
    
    const employeeStats = [];
    
    // Process each employee's statistics
    for (const employee of employees) {
      // Get leads added by this employee on the target date
      const leadsAdded = await Lead.find({
        addedBy: employee._id,
        addedByType: "Employee",
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).select('name phone email leadStatus priority').lean();
      
      // Get followups done by this employee on the target date
      const followupsDone = await Followup.find({
        followedBy: employee._id,
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      })
      .populate('leadId', 'name phone')
      .populate('followupStatus', 'name')
      .populate('priority', 'name')
      .lean();
      
      // Count unique leads in followups
      const uniqueLeadIds = new Set();
      followupsDone.forEach(followup => {
        uniqueLeadIds.add(followup.leadId._id.toString());
      });
      
      const stats = {
        employee: {
          _id: employee._id,
          name: employee.empName,
          email: employee.empEmail,
          designation: employee.empDesignation
        },
        date: targetDate.toISOString().split('T')[0],
        leadsAdded: {
          count: leadsAdded.length,
          details: leadsAdded
        },
        followupsDone: {
          count: followupsDone.length,
          uniqueLeads: uniqueLeadIds.size,
          details: followupsDone
        },
        totalWork: leadsAdded.length + followupsDone.length
      };
      
      employeeStats.push(stats);
    }
    
    // Sort by total work (descending)
    employeeStats.sort((a, b) => b.totalWork - a.totalWork);
    
    // Calculate overall statistics
    const overallStats = {
      totalEmployees: employeeStats.length,
      totalLeadsAdded: employeeStats.reduce((sum, stat) => sum + stat.leadsAdded.count, 0),
      totalFollowups: employeeStats.reduce((sum, stat) => sum + stat.followupsDone.count, 0),
      totalUniqueLeadsInFollowups: employeeStats.reduce((sum, stat) => sum + stat.followupsDone.uniqueLeads, 0),
      date: targetDate.toISOString().split('T')[0]
    };
    
    res.status(200).json({
      success: true,
      message: "Employee work statistics retrieved successfully",
      data: {
        overall: overallStats,
        employees: employeeStats
      }
    });
    
  } catch (error) {
    console.error("Error in getEmployeeWorkStats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Alternative optimized version with aggregation (faster for large datasets) dont in use
// export const getEmployeeWorkStatsOptimized = async (req, res) => {
//   try {
//     const { date } = req.query;
    
//     const targetDate = date ? new Date(date) : new Date();
//     const startOfDay = new Date(targetDate);
//     startOfDay.setHours(0, 0, 0, 0);
    
//     const endOfDay = new Date(targetDate);
//     endOfDay.setHours(23, 59, 59, 999);
    
//     // Get employee work stats using aggregation
//     const employeeStats = await Employee.aggregate([
//       { $match: { blocked: false } },
//       {
//         $lookup: {
//           from: "leads",
//           let: { employeeId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$addedBy", "$$employeeId"] },
//                     { $eq: ["$addedByType", "Employee"] },
//                     { $gte: ["$createdAt", startOfDay] },
//                     { $lte: ["$createdAt", endOfDay] }
//                   ]
//                 }
//               }
//             },
//             { $count: "count" }
//           ],
//           as: "leadsAdded"
//         }
//       },
//       {
//         $lookup: {
//           from: "followups",
//           let: { employeeId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$followedBy", "$$employeeId"] },
//                     { $gte: ["$createdAt", startOfDay] },
//                     { $lte: ["$createdAt", endOfDay] }
//                   ]
//                 }
//               }
//             },
//             { $count: "count" }
//           ],
//           as: "followupsDone"
//         }
//       },
//       {
//         $lookup: {
//           from: "followups",
//           let: { employeeId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$followedBy", "$$employeeId"] },
//                     { $gte: ["$createdAt", startOfDay] },
//                     { $lte: ["$createdAt", endOfDay] }
//                   ]
//                 }
//               }
//             },
//             { $group: { _id: "$leadId" } },
//             { $count: "count" }
//           ],
//           as: "uniqueLeadsFollowed"
//         }
//       },
//       {
//         $project: {
//           empName: 1,
//           empEmail: 1,
//           empDesignation: 1,
//           leadsAddedCount: { $arrayElemAt: ["$leadsAdded.count", 0] } || 0,
//           followupsDoneCount: { $arrayElemAt: ["$followupsDone.count", 0] } || 0,
//           uniqueLeadsFollowedCount: { $arrayElemAt: ["$uniqueLeadsFollowed.count", 0] } || 0,
//           totalWork: {
//             $add: [
//               { $arrayElemAt: ["$leadsAdded.count", 0] } || 0,
//               { $arrayElemAt: ["$followupsDone.count", 0] } || 0
//             ]
//           }
//         }
//       },
//       { $sort: { totalWork: -1 } }
//     ]);
    
//     // Calculate overall statistics
//     const overallStats = {
//       totalEmployees: employeeStats.length,
//       totalLeadsAdded: employeeStats.reduce((sum, stat) => sum + stat.leadsAddedCount, 0),
//       totalFollowups: employeeStats.reduce((sum, stat) => sum + stat.followupsDoneCount, 0),
//       totalUniqueLeadsInFollowups: employeeStats.reduce((sum, stat) => sum + stat.uniqueLeadsFollowedCount, 0),
//       date: targetDate.toISOString().split('T')[0]
//     };
    
//     res.status(200).json({
//       success: true,
//       message: "Employee work statistics retrieved successfully",
//       data: {
//         overall: overallStats,
//         employees: employeeStats
//       }
//     });
    
//   } catch (error) {
//     console.error("Error in getEmployeeWorkStatsOptimized:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };