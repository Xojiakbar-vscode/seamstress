const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define("PaymentHistory", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    user_id: DataTypes.INTEGER,
    total_earned: DataTypes.FLOAT,
    paid_amount: DataTypes.FLOAT,
    remaining_amount: DataTypes.FLOAT,
    payment_type: DataTypes.STRING,
    comment: DataTypes.STRING,

    month: DataTypes.INTEGER,
    year: DataTypes.INTEGER,

    archived_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
