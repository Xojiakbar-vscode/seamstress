const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define("MonthlyClosure", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    closed_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    closed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
