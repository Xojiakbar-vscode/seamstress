const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define("WorkLog", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    model_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    detail_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    time_per_unit: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    total_minutes: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    price_per_minute: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    total_price: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    work_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });
