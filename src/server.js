const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 5000;

// Database sinov
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Database connected successfully");

    // Database sinxronizatsiya
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("✅ Database synchronized");
    
    // Server ishga tushirish
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.message);
  });

// Signal'lar bilan serverni to'xtatish
process.on("SIGINT", () => {
  console.log("\n🛑 Server shutting down...");
  sequelize.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Server shutting down...");
  sequelize.close();
  process.exit(0);
});