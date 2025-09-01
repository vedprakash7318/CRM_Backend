import { addTag, getAllTags, getTagById, updateTag, deleteTag } from "../controllers/tag.controller.js";
import express from "express";

const tagRouter = express.Router();

tagRouter.post("/add/:id", addTag);
tagRouter.get("/getall/:id", getAllTags);
tagRouter.get("/getone/:id", getTagById);
tagRouter.put("/update/:id", updateTag);
tagRouter.delete("/delete/:id",deleteTag);

// ved  
export default tagRouter;