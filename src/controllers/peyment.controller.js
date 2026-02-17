const {
  Payment,
  PaymentHistory,
  WorkLog,
  User,
  sequelize
} = require("../models");

const { Op } = require("sequelize");

/* =======================================================
   YORDAMCHI FUNKSIYA – HAQIQIY QOLDIQNI HISOBLASH
   (Faqat WorkLogdagi hozirgi to'lanmagan summalarni yig'adi)
======================================================= */
async function calculateUserEarning(user_id, month, year) {
  const logs = await WorkLog.findAll({
    where: { 
      user_id, 
      month, 
      year,
      total_price: { [Op.gt]: 0 } // Faqat noldan katta summalarni olamiz
    }
  });

  return logs.reduce((sum, log) => sum + Number(log.total_price), 0);
}

/* =======================================================
   1️⃣ CREATE PAYMENT
======================================================= */
exports.createPayment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { user_id, paid_amount, payment_type, comment } = req.body;

    if (!user_id || !paid_amount || !payment_type) {
      return res.status(400).json({
        message: "user_id, paid_amount va payment_type majburiy"
      });
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: "User topilmadi" });
    }

    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    // 1️⃣ HOZIRGI QOLDIQ (WorkLogdagi jami to'lanishi kerak bo'lgan summa)
    // Bu yerda Payment summasini ayirish shart emas, chunki WorkLog 
    // oldingi to'lovlarda allaqachon update qilingan bo'ladi.
    const current_balance = await calculateUserEarning(user_id, month, year);

    // Ortiqcha to'lovni tekshirish
    if (Number(paid_amount) > current_balance) {
      return res.status(400).json({
        message: `To'lov miqdori qolgan summadan katta. Maksimal: ${current_balance}`
      });
    }

    const remaining_after = current_balance - Number(paid_amount);

    // 2️⃣ PAYMENT YARATISH
    const payment = await Payment.create(
      {
        user_id,
        total_earned: current_balance, // O'sha paytdagi qoldiq
        paid_amount,
        remaining_amount: remaining_after,
        payment_type,
        comment,
        month,
        year
      },
      { transaction }
    );

    // 3️⃣ WORKLOGDAN SUMMANI AYIRISH (Zanjir bo'yicha FIFO)
    let remainingToDeduct = Number(paid_amount);

    const worklogs = await WorkLog.findAll({
      where: { 
        user_id, 
        month, 
        year,
        total_price: { [Op.gt]: 0 } 
      },
      order: [["createdAt", "ASC"]],
      transaction
    });

    for (let log of worklogs) {
      if (remainingToDeduct <= 0) break;

      const logPrice = Number(log.total_price);

      if (logPrice >= remainingToDeduct) {
        log.total_price = logPrice - remainingToDeduct;
        remainingToDeduct = 0;
      } else {
        remainingToDeduct -= logPrice;
        log.total_price = 0;
      }

      await log.save({ transaction });
    }

    await transaction.commit();

    res.status(201).json({
      message: "Payment muvaffaqiyatli yaratildi",
      payment
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};

/* =======================================================
   2️⃣ GET ALL PAYMENTS (FILTER BILAN)
======================================================= */
exports.getPayments = async (req, res) => {
  try {
    const { user_id, month, year } = req.query;
    const where = {};

    if (user_id) where.user_id = user_id;
    if (month) where.month = month;
    if (year) where.year = year;

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ["id", "first_name", "last_name"]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json({
      count: payments.length,
      data: payments
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =======================================================
   3️⃣ GET PAYMENT BY ID
======================================================= */
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ["id", "first_name", "last_name"]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment topilmadi" });
    }

    res.json(payment);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =======================================================
   4️⃣ USER PAYMENT STATUS (REAL TIME HISOB)
======================================================= */
exports.getUserPaymentStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    // Faqat WorkLogdagi real to'lanmagan qoldiqni olamiz
    const remaining = await calculateUserEarning(userId, month, year);

    res.json({
      user_id: userId,
      month,
      year,
      remaining 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =======================================================
   5️⃣ ARCHIVE MONTHLY PAYMENTS → PAYMENT HISTORY
======================================================= */
exports.archiveMonthlyPayments = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { month, year } = req.body;

    const payments = await Payment.findAll({
      where: { month, year },
      transaction
    });

    if (payments.length === 0) {
      return res.status(400).json({
        message: "Arxivlash uchun payment topilmadi"
      });
    }

    const historyData = payments.map((p) => ({
      user_id: p.user_id,
      total_earned: p.total_earned,
      paid_amount: p.paid_amount,
      remaining_amount: p.remaining_amount,
      payment_type: p.payment_type,
      comment: p.comment,
      month: p.month,
      year: p.year
    }));

    await PaymentHistory.bulkCreate(historyData, { transaction });

    await Payment.destroy({
      where: { month, year },
      transaction
    });

    await transaction.commit();

    res.json({
      message: "Paymentlar tarixga ko'chirildi",
      archivedCount: payments.length
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};

/* =======================================================
   6️⃣ GET PAYMENT HISTORY
======================================================= */
exports.getPaymentHistory = async (req, res) => {
  try {
    const { user_id, month, year } = req.query;
    const where = {};

    if (user_id) where.user_id = user_id;
    if (month) where.month = month;
    if (year) where.year = year;

    const history = await PaymentHistory.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ["id", "first_name", "last_name"]
        }
      ],
      order: [["archived_at", "DESC"]]
    });

    res.json({
      count: history.length,
      data: history
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =======================================================
   7️⃣ GET PAYMENT HISTORY BY ID
======================================================= */
exports.getPaymentHistoryById = async (req, res) => {
  try {
    const history = await PaymentHistory.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ["id", "first_name", "last_name"]
        }
      ]
    });

    if (!history) {
      return res.status(404).json({ message: "PaymentHistory topilmadi" });
    }

    res.json(history);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePaymentHistoryById = async (req, res) => {
  try {
    const history = await PaymentHistory.findByPk(req.params.id);
    if (!history) {
      return res.status(404).json({ message: "PaymentHistory topilmadi" });
    }
    await history.destroy();
    res.json({ message: "PaymentHistory muvaffaqiyatli o'chirildi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =======================================================
  DELETE ALL PAYMENT HISTORY
======================================================= */
exports.deleteAllPaymentHistory = async (req, res) => {
  try {
    const deletedCount = await PaymentHistory.destroy({
      where: {},      // shart bo‘sh → hammasini o‘chiradi
      truncate: false // true qilinsa id lar resetlanadi, odatda false qoladi
    });

    res.json({ 
      message: `Barcha PaymentHistory muvaffaqiyatli o'chirildi (${deletedCount} ta yozuv)` 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
