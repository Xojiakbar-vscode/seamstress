const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define("SalaryRate", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    price_per_minute: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });
