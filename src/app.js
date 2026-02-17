const express = require("express");
const cors = require("cors");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Manager & Kassir Tizimi API",
      version: "1.0.0",
      description: "API documentation for Work Management System",
      contact: {
        name: "API Support",
        email: "support@example.com"
      }
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ["./src/routes/*.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes - to'g'ri chaqirish
// Har bir route object ichidan routerni olamiz
const {user} = require("./routes/user.routes");
const detailRoutes = require("./routes/detail.routes");
const modelRoutes = require("./routes/model.routes");
const worklogRoutes = require("./routes/worklog.routes");
const {salaryrate} = require("./routes/salary.routes");
const modelhistoryRoutes = require("./routes/modelhistory.routes");
const monthlyclosureRoutes = require("./routes/monthlyclosure.routes");
const usermonthlysummaryRoutes = require("./routes/usermonthlysummary.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const reportRoutes = require("./routes/report.routes");
const {payment} = require("./routes/payment.routes");

// Route'larni qo'shamiz
app.use("/users", user);
app.use("/details", detailRoutes.detail || detailRoutes);
app.use("/models", modelRoutes.model || modelRoutes);
app.use("/worklogs", worklogRoutes.worklog || worklogRoutes);
app.use("/salaryrates", salaryrate);
app.use("/modelhistory", modelhistoryRoutes.modelhistory || modelhistoryRoutes);
app.use("/monthlyclosure", monthlyclosureRoutes.monthlyclosure || monthlyclosureRoutes);
app.use("/usermonthlysummary", usermonthlysummaryRoutes.usermonthlysummary || usermonthlysummaryRoutes);
app.use("/dashboard", dashboardRoutes.dashboard || dashboardRoutes);
app.use("/reports", reportRoutes.report || reportRoutes);
app.use("/payments", payment);

// Health check
app.get("/", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Manager & Kassir Tizimi Backend is running 🚀",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// API status
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    database: "connected",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: "Not Found",
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(statusCode).json({
    error: "Server Error",
    message: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;