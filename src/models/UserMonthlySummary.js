const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define("UserMonthlySummary", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total_minutes: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    total_earned: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
  });
