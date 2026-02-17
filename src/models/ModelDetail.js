const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define("ModelDetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    model_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    detail_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    required_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    completed_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    time_per_unit: {
      type: DataTypes.FLOAT,
      allowNull: false // minut
    }
  });
