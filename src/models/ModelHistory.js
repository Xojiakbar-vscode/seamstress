const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define("ModelHistory", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    model_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    closed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
