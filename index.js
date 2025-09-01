import express from "express"
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from "./config/db.js"

// routers
import superAdminRouter from "./routes/superAdmin.routes.js";
import adminRouter from "./routes/admin.routes.js";
import leadRouter from "./routes/lead.routes.js";
import employeeRouter from "./routes/employee.routes.js";
import leadStatusRouter from "./routes/leadStatus.routes.js";
import followupStatusRouter from "./routes/followupStatus.routes.js";
import priorityRouter from "./routes/priority.routes.js";
import followupRouter from "./routes/followup.routes.js";
import leadSourcesRouter from "./routes/leadSources.routes.js";
import tagRouter from "./routes/tag.routes.js";


dotenv.config({})
connectDB()
const PORT = process.env.PORT || 3001

const app = express();
// const allowedOrigins = ['crm1.digicoders.in ', 'crm2.digicoders.in', 'crm3.digicoders.in'];

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
// };

// app.use(cors(corsOptions));
app.use(cors());
app.use(express.json())

// use these route
app.use('/digicoder/crm/api/v1/superadmin', superAdminRouter);
app.use('/digicoder/crm/api/v1/admin', adminRouter);
app.use('/digicoder/crm/api/v1/lead',leadRouter);
app.use('/digicoder/crm/api/v1/employee',employeeRouter);
app.use('/digicoder/crm/api/v1/leadstatus',leadStatusRouter);
app.use('/digicoder/crm/api/v1/leadSources',leadSourcesRouter);
app.use("/digicoder/crm/api/v1/followupstatus", followupStatusRouter)
app.use('/digicoder/crm/api/v1/priority',priorityRouter);
app.use('/digicoder/crm/api/v1/followup', followupRouter);
app.use('/digicoder/crm/api/v1/tags', tagRouter);



app.get('/',(_, res, next)=>{
    res.send("I'm Coming from Backend");
    next();
})

app.listen(PORT,(_, res)=>{
    console.log(`Server is Runing at port:->>>  http://localhost:${PORT}.`)
})
