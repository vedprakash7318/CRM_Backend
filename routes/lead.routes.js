import express from "express";
import { addLead, addManyLead,getAssignedLeads,getPendingLeadsByEmployee,getUnassignedLeads,employeesAllLeads,getAllLeads, deleteLead,restoreLead, assignLead,updateLead,negativedLead,closedLead ,UnclosedLead,UnnegativedLead,unassignLeads,getAllDeletedLeads, searchLeads} from "../controllers/lead.controller.js";

const leadRouter = express.Router()

leadRouter.post("/add/:id",addLead);  
leadRouter.post("/addmany/:id",addManyLead);
leadRouter.get("/getall/:id",getAllLeads);
leadRouter.get("/pendingleads/:id",getPendingLeadsByEmployee);
leadRouter.get("/getDeletedall/:id",getAllDeletedLeads);
leadRouter.get("/getAssignedLeads/:id",getAssignedLeads);
leadRouter.get("/getUnassignedLeads/:id",getUnassignedLeads);
leadRouter.get("/empgetall/:id",employeesAllLeads);
leadRouter.put("/update/:id",updateLead);
leadRouter.put("/delete/:id",deleteLead);
leadRouter.put("/restore/:id",restoreLead);
leadRouter.put("/assign",assignLead);
leadRouter.put("/unassign",unassignLeads);
leadRouter.put("/negative/:id",negativedLead);
leadRouter.put("/closed/:id",closedLead);
leadRouter.put("/unclosed/:id",UnclosedLead);
leadRouter.put("/UnnegativedLead/:id",UnnegativedLead);

leadRouter.get('/search', searchLeads);


export default leadRouter

