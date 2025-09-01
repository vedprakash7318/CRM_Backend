import { addEmployee, loginEmployee,getBlockedEmployees, updateEmployee, getAllEmployees, getEmployeeById, blockEmployee, unBlockEmployee, getEmployeeWorkStats } from "../controllers/employee.controller.js";
import express from "express";

const employeeRouter = express.Router();

employeeRouter.post('/add/:id',addEmployee);
employeeRouter.put('/update/:id',updateEmployee);
employeeRouter.post('/login',loginEmployee);
employeeRouter.get('/getall/:id', getAllEmployees);
employeeRouter.get('/employees/blocked/:id', getBlockedEmployees);

employeeRouter.get('/getone/:id', getEmployeeById);
employeeRouter.put("/block/:id", blockEmployee);
employeeRouter.put("/unblock/:id", unBlockEmployee);


employeeRouter.get('/emp-work', getEmployeeWorkStats)


export default employeeRouter;  