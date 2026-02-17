const { UserMonthlySummary, User, MonthlyClosure } = require("../models");
const { Op } = require("sequelize");

// Foydalanuvchi oylik summariyasini olish
exports.getUserMonthlySummaries = async (req, res) => {
  try {
    const { user_id, month, year, start_month, start_year, end_month, end_year } = req.query;
    
    const whereClause = {};
    
    if (user_id) whereClause.user_id = user_id;
    if (month) whereClause.month = month;
    if (year) whereClause.year = year;
    
    // Oraliq vaqt bo'yicha qidirish
    if (start_month && start_year && end_month && end_year) {
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { year: { [Op.gt]: start_year } },
            { 
              year: start_year,
              month: { [Op.gte]: start_month }
            }
          ]
        },
        {
          [Op.or]: [
            { year: { [Op.lt]: end_year } },
            { 
              year: end_year,
              month: { [Op.lte]: end_month }
            }
          ]
        }
      ];
    }

    const summaries = await UserMonthlySummary.findAll({
      where: whereClause,
      include: [
        { 
          model: User,
          attributes: ['id', 'first_name', 'last_name', 'role'] 
        }
      ],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    
    res.status(200).json(summaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ID bo'yicha summariyani olish
exports.getUserMonthlySummaryById = async (req, res) => {
  try {
    const summary = await UserMonthlySummary.findByPk(req.params.id, {
      include: [
        { 
          model: User,
          attributes: ['id', 'first_name', 'last_name', 'role'] 
        }
      ]
    });
    
    if (!summary) {
      return res.status(404).json({ message: "Monthly summary not found" });
    }

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Foydalanuvchi bo'yicha oylik summariyalar
exports.getUserSummariesByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const summaries = await UserMonthlySummary.findAll({
      where: { user_id: userId },
      order: [['year', 'DESC'], ['month', 'DESC']],
      include: [
        { 
          model: User,
          attributes: ['id', 'first_name', 'last_name'] 
        }
      ]
    });

    // Statistikalar
    const totalMonths = summaries.length;
    const totalEarned = summaries.reduce((sum, s) => sum + s.total_earned, 0);
    const totalMinutes = summaries.reduce((sum, s) => sum + s.total_minutes, 0);
    const averageMonthly = totalMonths > 0 ? totalEarned / totalMonths : 0;

    res.status(200).json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name
      },
      statistics: {
        totalMonths,
        totalEarned: totalEarned.toFixed(2),
        totalMinutes: totalMinutes.toFixed(2),
        averageMonthly: averageMonthly.toFixed(2)
      },
      summaries
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Oy bo'yicha barcha foydalanuvchilar summariyasi
exports.getMonthlySummaryByMonth = async (req, res) => {
  try {
    const { month, year } = req.params;
    
    const summaries = await UserMonthlySummary.findAll({
      where: { 
        month: parseInt(month), 
        year: parseInt(year) 
      },
      include: [
        { 
          model: User,
          attributes: ['id', 'first_name', 'last_name'] 
        }
      ],
      order: [['total_earned', 'DESC']]
    });

    // Oyni yopish ma'lumotlari
    const monthlyClosure = await MonthlyClosure.findOne({
      where: { month: parseInt(month), year: parseInt(year) }
    });

    // Statistikalar
    const totalUsers = summaries.length;
    const totalEarned = summaries.reduce((sum, s) => sum + s.total_earned, 0);
    const totalMinutes = summaries.reduce((sum, s) => sum + s.total_minutes, 0);
    const averagePerUser = totalUsers > 0 ? totalEarned / totalUsers : 0;

    res.status(200).json({
      month: parseInt(month),
      year: parseInt(year),
      monthlyClosure: monthlyClosure || null,
      statistics: {
        totalUsers,
        totalEarned: totalEarned.toFixed(2),
        totalMinutes: totalMinutes.toFixed(2),
        averagePerUser: averagePerUser.toFixed(2)
      },
      summaries
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eng ko'p daromad olgan foydalanuvchilar
exports.getTopEarners = async (req, res) => {
  try {
    const { limit = 10, month, year } = req.query;
    
    const whereClause = {};
    if (month) whereClause.month = month;
    if (year) whereClause.year = year;

    const summaries = await UserMonthlySummary.findAll({
      where: whereClause,
      include: [
        { 
          model: User,
          attributes: ['id', 'first_name', 'last_name'] 
        }
      ],
      order: [['total_earned', 'DESC']],
      limit: parseInt(limit)
    });

    res.status(200).json({
      total: summaries.length,
      topEarners: summaries
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Yillik summariya
exports.getYearlySummary = async (req, res) => {
  try {
    const { year } = req.params;
    
    const summaries = await UserMonthlySummary.findAll({
      where: { year: parseInt(year) },
      include: [
        { 
          model: User,
          attributes: ['id', 'first_name', 'last_name'] 
        }
      ],
      order: [['month', 'ASC']]
    });

    // Userlar bo'yicha guruhlash
    const userYearlyStats = {};
    const monthlyStats = {};
    
    summaries.forEach(summary => {
      const userId = summary.user_id;
      const month = summary.month;
      
      // Userlar bo'yicha
      if (!userYearlyStats[userId]) {
        userYearlyStats[userId] = {
          user: summary.User,
          totalEarned: 0,
          totalMinutes: 0,
          months: 0,
          monthlyDetails: []
        };
      }
      
      userYearlyStats[userId].totalEarned += summary.total_earned;
      userYearlyStats[userId].totalMinutes += summary.total_minutes;
      userYearlyStats[userId].months++;
      userYearlyStats[userId].monthlyDetails.push({
        month: summary.month,
        earned: summary.total_earned,
        minutes: summary.total_minutes
      });
      
      // Oy bo'yicha
      const monthKey = `${summary.month}`;
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: summary.month,
          totalEarned: 0,
          totalMinutes: 0,
          totalUsers: 0
        };
      }
      
      monthlyStats[monthKey].totalEarned += summary.total_earned;
      monthlyStats[monthKey].totalMinutes += summary.total_minutes;
      monthlyStats[monthKey].totalUsers++;
    });

    res.status(200).json({
      year: parseInt(year),
      yearlyStatistics: {
        totalUsers: Object.keys(userYearlyStats).length,
        totalMonths: summaries.length,
        totalEarned: Object.values(userYearlyStats).reduce((sum, u) => sum + u.totalEarned, 0),
        totalMinutes: Object.values(userYearlyStats).reduce((sum, u) => sum + u.totalMinutes, 0)
      },
      userYearlyStats: Object.values(userYearlyStats).map(stats => ({
        user: stats.user,
        totalEarned: stats.totalEarned.toFixed(2),
        totalMinutes: stats.totalMinutes.toFixed(2),
        months: stats.months,
        averageMonthly: (stats.totalEarned / stats.months).toFixed(2),
        monthlyDetails: stats.monthlyDetails
      })),
      monthlyStats: Object.values(monthlyStats).map(stats => ({
        month: stats.month,
        totalEarned: stats.totalEarned.toFixed(2),
        totalMinutes: stats.totalMinutes.toFixed(2),
        totalUsers: stats.totalUsers,
        averagePerUser: (stats.totalEarned / stats.totalUsers).toFixed(2)
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Foydalanuvchi uchun oxirgi oylik summariya
exports.getUserLastMonthlySummary = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const summary = await UserMonthlySummary.findOne({
      where: { user_id: userId },
      order: [['year', 'DESC'], ['month', 'DESC']],
      include: [
        { 
          model: User,
          attributes: ['id', 'first_name', 'last_name'] 
        }
      ]
    });
    
    if (!summary) {
      return res.status(404).json({ 
        message: "No monthly summary found for this user" 
      });
    }

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};