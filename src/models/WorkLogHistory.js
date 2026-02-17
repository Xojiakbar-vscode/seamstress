// models/WorkLogHistory.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define("WorkLogHistory", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    // Asl worklog ID sini saqlab qo'yish foydali bo'lishi mumkin
    original_worklog_id: { type: DataTypes.INTEGER },
    user_id: { type: DataTypes.INTEGER },
    model_id: { type: DataTypes.INTEGER },
    detail_id: { type: DataTypes.INTEGER },
    quantity: { type: DataTypes.INTEGER },
    total_price: { type: DataTypes.FLOAT },
    work_date: { type: DataTypes.DATEONLY },
    archived_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    // Arxivlash sababi yoki kim o'chirgani haqida qo'shimcha maydon
    reason: { type: DataTypes.STRING }
  });