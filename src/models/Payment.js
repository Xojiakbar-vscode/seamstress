const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define("Payment", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    total_earned: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },

    paid_amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

    remaining_amount: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },

    payment_type: {
      type: DataTypes.ENUM("monthly", "advance"),
      allowNull: false
    },

    comment: {
      type: DataTypes.STRING
    },

    month: DataTypes.INTEGER,
    year: DataTypes.INTEGER
  });
