const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM("manager", "cashier", "worker"),
      allowNull: false,
      defaultValue: "worker"
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });
