import express from "express";
import {
    registerAdmin,
    adminLogin,
    getAllAdmins,
    getAdminById,
    blockAdmin,
    unBlockAdmin,
    updateAdmin,
    requestReset,    // New route for OTP request
    verifyOtp,       // New route for OTP verification
    resetPassword    // New route for resetting password
} from "../controllers/admin.controller.js";

const adminRouter = express.Router();

adminRouter.post("/add/:id", registerAdmin);
adminRouter.put("/update/:id", updateAdmin);
adminRouter.post("/login", adminLogin);
adminRouter.get("/getall", getAllAdmins);
adminRouter.get("/getone/:id", getAdminById);
adminRouter.put("/block/:id", blockAdmin);
adminRouter.put("/unblock/:id", unBlockAdmin);

// Password Reset Routes
adminRouter.post("/forget-password/request", requestReset); // Send OTP
adminRouter.post("/forget-password/verify", verifyOtp);     // Verify OTP
adminRouter.post("/forget-password/reset", resetPassword);  // Reset password

export default adminRouter;
