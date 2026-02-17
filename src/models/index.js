const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

/* ================= MODELS INITIALIZATION ================= */
const User = require("./User")(sequelize, DataTypes);
const Detail = require("./Detail")(sequelize, DataTypes);
const Model = require("./Model")(sequelize, DataTypes);
const ModelDetail = require("./ModelDetail")(sequelize, DataTypes);
const SalaryRate = require("./SalaryRate")(sequelize, DataTypes);
const WorkLog = require("./WorkLog")(sequelize, DataTypes);
const WorkLogHistory = require("./WorkLogHistory")(sequelize, DataTypes);
const ModelHistory = require("./ModelHistory")(sequelize, DataTypes);
const MonthlyClosure = require("./MonthlyClosure")(sequelize, DataTypes);
const UserMonthlySummary = require("./UserMonthlySummary")(sequelize, DataTypes);

// YANGI QO'SHILGAN MODELLAR
const Payment = require("./Payment")(sequelize, DataTypes);
const PaymentHistory = require("./PaymentHistory")(sequelize, DataTypes);

/* ================= RELATIONS (BOG'LIQLIKLAR) ================= */

// 1. Model ↔ Detail (Many-to-Many via ModelDetail)
Model.hasMany(ModelDetail, { foreignKey: "model_id" });
ModelDetail.belongsTo(Model, { foreignKey: "model_id" });

Detail.hasMany(ModelDetail, { foreignKey: "detail_id" });
ModelDetail.belongsTo(Detail, { foreignKey: "detail_id" });

// 2. User ↔ WorkLog
User.hasMany(WorkLog, { foreignKey: "user_id" });
WorkLog.belongsTo(User, { foreignKey: "user_id" });

// 3. Model ↔ WorkLog
Model.hasMany(WorkLog, { foreignKey: "model_id" });
WorkLog.belongsTo(Model, { foreignKey: "model_id" });

// 4. Detail ↔ WorkLog
Detail.hasMany(WorkLog, { foreignKey: "detail_id" });
WorkLog.belongsTo(Detail, { foreignKey: "detail_id" });

// 5. WorkLogHistory (Arxivlangan ma'lumotlar)
User.hasMany(WorkLogHistory, { foreignKey: "user_id" });
WorkLogHistory.belongsTo(User, { foreignKey: "user_id" });

Model.hasMany(WorkLogHistory, { foreignKey: "model_id" });
WorkLogHistory.belongsTo(Model, { foreignKey: "model_id" });

Detail.hasMany(WorkLogHistory, { foreignKey: "detail_id" });
WorkLogHistory.belongsTo(Detail, { foreignKey: "detail_id" });

// 6. ModelHistory (Model yopilish tarixi)
Model.hasOne(ModelHistory, { foreignKey: "model_id" });
ModelHistory.belongsTo(Model, { foreignKey: "model_id" });

// 7. Monthly Summary (Oylik hisobotlar)
User.hasMany(UserMonthlySummary, { foreignKey: "user_id" });
UserMonthlySummary.belongsTo(User, { foreignKey: "user_id" });

// 8. Monthly Closure (Oylik yopilish jarayoni)
MonthlyClosure.hasMany(UserMonthlySummary, { foreignKey: "closure_id" });
UserMonthlySummary.belongsTo(MonthlyClosure, { foreignKey: "closure_id" });

User.hasMany(MonthlyClosure, { foreignKey: "user_id", as: 'Closures' });
MonthlyClosure.belongsTo(User, { foreignKey: "user_id", as: 'ClosedByUser' });

/* ================= PAYMENT RELATIONS (YANGI) ================= */

Payment.belongsTo(User, { foreignKey: "user_id" });
PaymentHistory.belongsTo(User, { foreignKey: "user_id" });

/* ================= EXPORT MODELS ================= */
module.exports = {
  sequelize,
  User,
  Detail,
  Model,
  ModelDetail,
  SalaryRate,
  WorkLog,
  WorkLogHistory,
  ModelHistory,
  MonthlyClosure,
  UserMonthlySummary,
  Payment,
  PaymentHistory
};