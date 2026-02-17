const { MonthlyClosure, User, WorkLog, UserMonthlySummary } = require("../models");
const { Op } = require("sequelize");

// Oyni yopish (Close Month)
exports.closeMonth = async (req, res) => {
  try {
    const { month, year, closed_by } = req.body;

    // Oyni tekshirish
    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ 
        message: "Valid month (1-12) is required" 
      });
    }

    if (!year || year < 2020) {
      return res.status(400).json({ 
        message: "Valid year is required" 
      });
    }

    // Oyni yopish menejer tomonidan amalga oshirilishi kerak
    const closingUser = await User.findByPk(closed_by);
    if (!closingUser || closingUser.role !== 'manager') {
      return res.status(403).json({ 
        message: "Only managers can close months" 
      });
    }

    // Bu oy allaqachon yopilganmi tekshirish
    const existingClosure = await MonthlyClosure.findOne({
      where: { month, year }
    });

    if (existingClosure) {
      return res.status(400).json({ 
        message: `Month ${month}/${year} is already closed` 
      });
    }

    // Transaction orqali oyni yopish
    const result = await MonthlyClosure.sequelize.transaction(async (t) => {
      // Foydalanuvchilarning oylik summariyasini yaratish
      const workLogs = await WorkLog.findAll({
        where: { 
          month, 
          year 
        },
        include: [User],
        transaction: t
      });

      // Userlar bo'yicha guruhlash
      const userStats = {};
      workLogs.forEach(log => {
        const userId = log.user_id;
        if (!userStats[userId]) {
          userStats[userId] = {
            user: log.User,
            totalMinutes: 0,
            totalEarned: 0
          };
        }
        
        userStats[userId].totalMinutes += log.total_minutes;
        userStats[userId].totalEarned += log.total_price;
      });

      // UserMonthlySummary yozuvlarini yaratish
      const userSummaries = [];
      for (const userId in userStats) {
        const summary = await UserMonthlySummary.create({
          user_id: parseInt(userId),
          month,
          year,
          total_minutes: userStats[userId].totalMinutes,
          total_earned: userStats[userId].totalEarned
        }, { transaction: t });
        
        userSummaries.push(summary);
      }

      // Oyni yopish yozuvini yaratish
      const monthlyClosure = await MonthlyClosure.create({
        month,
        year,
        closed_by,
        closed_at: new Date()
      }, { transaction: t });

      return {
        monthlyClosure,
        userSummaries,
        totalUsers: Object.keys(userStats).length,
        totalWorkLogs: workLogs.length
      };
    });

    res.status(201).json({
      message: `Month ${month}/${year} closed successfully`,
      ...result
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Barcha yopilgan oylarni olish
exports.getMonthlyClosures = async (req, res) => {
  try {
    const monthlyClosures = await MonthlyClosure.findAll({
      include: [
        { 
          model: User, 
          as: 'ClosedByUser',
          attributes: ['id', 'first_name', 'last_name'] 
        }
      ],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    
    res.status(200).json(monthlyClosures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ID bo'yicha yopilgan oyni olish
exports.getMonthlyClosureById = async (req, res) => {
  try {
    const monthlyClosure = await MonthlyClosure.findByPk(req.params.id, {
      include: [
        { 
          model: User, 
          as: 'ClosedByUser',
          attributes: ['id', 'first_name', 'last_name'] 
        },
        {
          model: UserMonthlySummary,
          include: [User]
        }
      ]
    });
    
    if (!monthlyClosure) {
      return res.status(404).json({ message: "Monthly closure not found" });
    }

    res.status(200).json(monthlyClosure);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Oy va yil bo'yicha yopilgan oyni olish
exports.getMonthlyClosureByMonthYear = async (req, res) => {
  try {
    const { month, year } = req.params;
    
    const monthlyClosure = await MonthlyClosure.findOne({
      where: { month: parseInt(month), year: parseInt(year) },
      include: [
        { 
          model: User, 
          as: 'ClosedByUser',
          attributes: ['id', 'first_name', 'last_name'] 
        },
        {
          model: UserMonthlySummary,
          include: [User]
        }
      ]
    });
    
    if (!monthClosure) {
      return res.status(404).json({ 
        message: `Month ${month}/${year} is not closed or not found` 
      });
    }

    res.status(200).json(monthlyClosure);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Oxirgi yopilgan oyni olish
exports.getLastClosedMonth = async (req, res) => {
  try {
    const monthlyClosure = await MonthlyClosure.findOne({
      order: [['year', 'DESC'], ['month', 'DESC']],
      include: [
        { 
          model: User, 
          as: 'ClosedByUser',
          attributes: ['id', 'first_name', 'last_name'] 
        }
      ]
    });
    
    if (!monthlyClosure) {
      return res.status(404).json({ message: "No closed months found" });
    }

    res.status(200).json(monthlyClosure);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Oyni yopishni bekor qilish (faqat admin uchun)
exports.deleteMonthlyClosure = async (req, res) => {
  try {
    const monthlyClosure = await MonthlyClosure.findByPk(req.params.id);
    
    if (!monthlyClosure) {
      return res.status(404).json({ message: "Monthly closure not found" });
    }

    const monthlyClosureData = monthlyClosure.toJSON();
    
    // Transaction bilan o'chirish
    await MonthlyClosure.sequelize.transaction(async (t) => {
      // Bog'liq UserMonthlySummary yozuvlarini o'chirish
      await UserMonthlySummary.destroy({
        where: { 
          month: monthlyClosure.month,
          year: monthlyClosure.year
        },
        transaction: t
      });

      // Oyni yopish yozuvini o'chirish
      await monthlyClosure.destroy({ transaction: t });
    });

    res.status(200).json({
      message: "Monthly closure deleted successfully",
      deletedClosure: monthlyClosureData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Yopilgan oylar statistikasi
exports.getClosureStatistics = async (req, res) => {
  try {
    const monthlyClosures = await MonthlyClosure.findAll({
      include: [
        {
          model: UserMonthlySummary
        }
      ],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });

    // Statistikalar
    const totalClosures = monthlyClosures.length;
    let totalEarned = 0;
    let totalMinutes = 0;
    let totalUsers = 0;

    monthlyClosures.forEach(closure => {
      closure.UserMonthlySummaries.forEach(summary => {
        totalEarned += summary.total_earned;
        totalMinutes += summary.total_minutes;
        totalUsers++;
      });
    });

    // Oy bo'yicha guruhlash
    const monthlyStats = monthlyClosures.map(closure => {
      let closureEarned = 0;
      let closureMinutes = 0;
      let closureUsers = 0;

      closure.UserMonthlySummaries.forEach(summary => {
        closureEarned += summary.total_earned;
        closureMinutes += summary.total_minutes;
        closureUsers++;
      });

      return {
        month: closure.month,
        year: closure.year,
        closedBy: closure.ClosedByUser,
        closedAt: closure.closed_at,
        statistics: {
          totalUsers: closureUsers,
          totalMinutes: closureMinutes,
          totalEarned: closureEarned,
          averagePerUser: closureUsers > 0 ? closureEarned / closureUsers : 0
        }
      };
    });

    res.status(200).json({
      totalClosures,
      overallStatistics: {
        totalEarned: totalEarned.toFixed(2),
        totalMinutes: totalMinutes.toFixed(2),
        totalUsers,
        averagePerClosure: totalClosures > 0 ? totalEarned / totalClosures : 0
      },
      monthlyStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};