import mongoose from "mongoose";
import Tag from "../models/tag.modal.js";


export const addTag = async (req, res) => {
    try {
        const addedBy = req.params.id;
        // console.log(addedBy);
        
        const { tagName, userType } = req.body;     
        // console.log(tagName);
           
        if (!tagName || !mongoose.Types.ObjectId.isValid(addedBy)) {
            return res.status(404).json({
                message: "TagName and addedBy are required !.",
                success: false
            })
        }
        
        const isExistTag = await Tag.findOne({tagName:tagName})
        if(isExistTag){
            return res.status(400).json({
                message:Tag `${tagName}' alrady exist!`,
                success:false
            })
        }
        const newTag = await Tag.create({
            tagName: tagName,
            addedBy,
            addedByType: userType === "Employee" ? "Empolyee" : "Admin"
        });
        return res.status(201).json({
            message: "Tag added successfully !",
            newTag,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server Error at the time of Adding Tag!.",
            success: false
        })
    }
}
export const getAllTags = async (req, res) => {
    try {
        const addedBy = req.params.id;
        const tags = await Tag.find({ addedBy: addedBy }).populate("addedBy");
        if (!tags) {
            return res.status(404).json({
                message: "Tag Not Found !.",
                success: false
            })
        }

        return res.status(201).json({
            message: "These are the registered Tags !",
            tags,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server Error at the time of fetching all Tag!.",
            success: false
        })
    }
}



// export const getAllTags = async (req, res) => {
//     try {
//         const addedBy = req.params.id;
//         const { page = 1, limit = 20, search = '' } = req.query;
        
//         const query = { 
//             addedBy: addedBy,
//             ...(search && { tagName: { $regex: search, $options: 'i' } })
//         };

//         const options = {
//             page: parseInt(page),
//             limit: parseInt(limit),
//             populate: "addedBy",
//             sort: { createdAt: -1 }
//         };

//         const result = await Tag.paginate(query, options);
        
//         if (!result.docs || result.docs.length === 0) {
//             return res.status(404).json({
//                 message: "No tags found!",
//                 success: false
//             });
//         }

//         return res.status(200).json({
//             message: "Tags retrieved successfully",
//             tags: result.docs,
//             totalCount: result.totalDocs,
//             success: true
//         });

//     } catch (error) {
//         return res.status(500).json({
//             message: error.message || "Internal server Error",
//             success: false
//         });
//     }
// };

export const getTagById = async (req, res) => {
    try {
        const tagId = req.params.id;
        if (!tagId) {
            return res.status(404).json({
                message: "Tag Id Not Found !.",
                success: false
            })
        }
        const tag = await Tag.findOne({_id:tagId});
        if (!tag) {
            return res.status(404).json({
                message: "Tag Not Found !.",
                success: false
            })
        }

        return res.status(201).json({
            message: "This is the registered Tag !",
            tag,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server Error at the time of fetching single Tag!.",
            success: false
        })
    }
}
export const updateTag = async (req, res) => {
    try {
        const tagId = req.params.id;
        const { tagName } = req.body;
        if (!tagName) {
            return res.status(404).json({
                message: "TagName is required !.",
                success: false
            })
        }
        if (!tagId) {
            return res.status(404).json({
                message: "TagId Not Found !.",
                success: false
            })
        }
        const tag = await Tag.findOne({_id:tagId});
        if (!tag) {
            return res.status(404).json({
                message: "Tag Not Found !.",
                success: false
            })
        }

        // updating status
        tag.tagName = tagName;
        tag.save();
        return res.status(201).json({
            message: "Lead status Updated Successfully!",
            tag,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server Error at the time of Updating Tag!.",
            success: false
        })
    }
}

export const deleteTag = async (req, res) => {
    try {
        const tagId = req.params.id;
        if (!tagId) {
            return res.status(404).json({
                message: "TagId Not Found !.",
                success: false
            })
        }
        const deletedTag = await Tag.findByIdAndDelete(tagId);
        if (!deletedTag) {
            return res.status(404).json({
                message: "Tag Not Found !.",
                success: false
            })
        }

        return res.status(201).json({
            message: "Lead status Deleted successfully !",
            deletedTag,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server Error at the time of Deletion of Tag!.",
            success: false
        })
    }
}