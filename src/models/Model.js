const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define("Model", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    total_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("active", "completed"),
      defaultValue: "active"
    }
  });
