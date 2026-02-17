const { 
  User, 
  Model, 
  Detail, 
  WorkLog, 
  ModelHistory, 
  UserMonthlySummary,
  MonthlyClosure,
  SalaryRate
} = require("../models");
const { Op } = require("sequelize");

// Dashboard statistikalarini olish
exports.getDashboardStats = async (req, res) => {
  try {
    // Jami foydalanuvchilar
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });

    // Model statistikasi
    const activeModels = await Model.count({ where: { status: 'active' } });
    const completedModels = await Model.count({ where: { status: 'completed' } });
    const totalModels = activeModels + completedModels;

    // Jami detallar
    const totalDetails = await Detail.count();

    // Oylik statistikalar (joriy oy)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const currentMonthWorkLogs = await WorkLog.findAll({
      where: {
        month: currentMonth,
        year: currentYear
      }
    });

    let monthlyTotalEarned = 0;
    let monthlyTotalMinutes = 0;
    
    currentMonthWorkLogs.forEach(log => {
      monthlyTotalEarned += log.total_price;
      monthlyTotalMinutes += log.total_minutes;
    });

    // Oxirgi yopilgan oy
    const lastClosedMonth = await MonthlyClosure.findOne({
      order: [['year', 'DESC'], ['month', 'DESC']]
    });

    // Faol ish haqi stavkasi
    const activeSalaryRate = await SalaryRate.findOne({
      where: { is_active: true }
    });

    // Oxirgi 7 kunlik ish statistikasi
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const lastWeekWorkLogs = await WorkLog.findAll({
      where: {
        work_date: {
          [Op.gte]: last7Days
        }
      }
    });

    // Oxirgi 5 ta tugallangan model
    const recentCompletedModels = await ModelHistory.findAll({
      limit: 5,
      include: [Model],
      order: [['closed_at', 'DESC']]
    });

    // Eng ko'p daromad olgan 5 ta foydalanuvchi (joriy oy)
    const currentMonthSummaries = await UserMonthlySummary.findAll({
      where: {
        month: currentMonth,
        year: currentYear
      },
      include: [User],
      order: [['total_earned', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      userStatistics: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers
      },
      modelStatistics: {
        totalModels,
        activeModels,
        completedModels,
        completionPercentage: totalModels > 0 ? (completedModels / totalModels) * 100 : 0
      },
      detailStatistics: {
        totalDetails
      },
      currentMonthStatistics: {
        month: currentMonth,
        year: currentYear,
        totalEarned: monthlyTotalEarned.toFixed(2),
        totalMinutes: monthlyTotalMinutes.toFixed(2),
        workLogsCount: currentMonthWorkLogs.length
      },
      lastClosedMonth: lastClosedMonth ? {
        month: lastClosedMonth.month,
        year: lastClosedMonth.year,
        closedAt: lastClosedMonth.closed_at
      } : null,
      salaryRate: activeSalaryRate ? {
        price_per_minute: activeSalaryRate.price_per_minute,
        updatedAt: activeSalaryRate.updatedAt
      } : null,
      recentActivity: {
        last7DaysWorkLogs: lastWeekWorkLogs.length,
        recentCompletedModels: recentCompletedModels.map(history => ({
          model: history.Model.name,
          completedAt: history.closed_at
        })),
        topEarnersCurrentMonth: currentMonthSummaries.map(summary => ({
          user: `${summary.User.first_name} ${summary.User.last_name}`,
          earned: summary.total_earned.toFixed(2)
        }))
      },
      totals: {
        totalWorkLogs: await WorkLog.count(),
        totalClosedMonths: await MonthlyClosure.count(),
        totalSalaryRates: await SalaryRate.count()
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Foydalanuvchi bo'yicha statistikalar
exports.getUserStatistics = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Foydalanuvchi ish yozuvlari
    const workLogs = await WorkLog.findAll({
      where: { user_id: userId }
    });

    // Oylik summariyalar
    const monthlySummaries = await UserMonthlySummary.findAll({
      where: { user_id: userId },
      order: [['year', 'DESC'], ['month', 'DESC']]
    });

    // Statistikalar
    const totalWorkLogs = workLogs.length;
    const totalQuantity = workLogs.reduce((sum, log) => sum + log.quantity, 0);
    const totalEarnedAllTime = workLogs.reduce((sum, log) => sum + log.total_price, 0);
    const totalMinutesAllTime = workLogs.reduce((sum, log) => sum + log.total_minutes, 0);

    // Oxirgi 30 kunlik faoliyat
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentWorkLogs = await WorkLog.findAll({
      where: {
        user_id: userId,
        work_date: {
          [Op.gte]: last30Days
        }
      },
      include: [Model, Detail],
      order: [['work_date', 'DESC']],
      limit: 20
    });

    // Eng ko'p ishlagan modellar
    const modelStats = {};
    workLogs.forEach(log => {
      if (!modelStats[log.model_id]) {
        modelStats[log.model_id] = {
          modelId: log.model_id,
          totalQuantity: 0,
          totalEarned: 0
        };
      }
      modelStats[log.model_id].totalQuantity += log.quantity;
      modelStats[log.model_id].totalEarned += log.total_price;
    });

    // Model nomlarini olish
    const modelIds = Object.keys(modelStats);
    const models = await Model.findAll({
      where: { id: modelIds },
      attributes: ['id', 'name']
    });

    // Model statistikasiga nom qo'shish
    const modelStatistics = Object.values(modelStats).map(stat => {
      const model = models.find(m => m.id === stat.modelId);
      return {
        modelName: model ? model.name : 'Unknown',
        ...stat,
        totalEarned: stat.totalEarned.toFixed(2)
      };
    }).sort((a, b) => b.totalEarned - a.totalEarned);

    res.status(200).json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: user.is_active
      },
      statistics: {
        totalWorkLogs,
        totalQuantity,
        totalEarnedAllTime: totalEarnedAllTime.toFixed(2),
        totalMinutesAllTime: totalMinutesAllTime.toFixed(2),
        averagePerWorkLog: totalWorkLogs > 0 ? (totalEarnedAllTime / totalWorkLogs).toFixed(2) : 0
      },
      monthlyStatistics: monthlySummaries.map(summary => ({
        month: summary.month,
        year: summary.year,
        totalEarned: summary.total_earned.toFixed(2),
        totalMinutes: summary.total_minutes.toFixed(2)
      })),
      modelStatistics: modelStatistics.slice(0, 10), // Top 10 models
      recentActivity: {
        last30DaysWorkLogs: recentWorkLogs.length,
        recentWorkLogs: recentWorkLogs.map(log => ({
          date: log.work_date,
          model: log.Model ? log.Model.name : 'Unknown',
          detail: log.Detail ? log.Detail.name : 'Unknown',
          quantity: log.quantity,
          earned: log.total_price.toFixed(2)
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Model bo'yicha statistikalar
exports.getModelStatistics = async (req, res) => {
  try {
    const modelId = req.params.id;
    
    const model = await Model.findByPk(modelId, {
      include: [
        {
          model: ModelDetail,
          include: [Detail]
        },
        {
          model: WorkLog,
          include: [User]
        }
      ]
    });
    
    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    // Statistikalar
    const totalRequired = model.ModelDetails.reduce((sum, detail) => sum + detail.required_quantity, 0);
    const totalCompleted = model.ModelDetails.reduce((sum, detail) => sum + detail.completed_quantity, 0);
    const completionPercentage = totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0;

    // Ish yozuvlari bo'yicha statistikalar
    const totalWorkLogs = model.WorkLogs.length;
    const totalEarned = model.WorkLogs.reduce((sum, log) => sum + log.total_price, 0);
    const totalMinutes = model.WorkLogs.reduce((sum, log) => sum + log.total_minutes, 0);

    // Foydalanuvchilar bo'yicha taqsimot
    const userDistribution = {};
    model.WorkLogs.forEach(log => {
      if (!userDistribution[log.user_id]) {
        userDistribution[log.user_id] = {
          user: log.User,
          totalQuantity: 0,
          totalEarned: 0
        };
      }
      userDistribution[log.user_id].totalQuantity += log.quantity;
      userDistribution[log.user_id].totalEarned += log.total_price;
    });

    // Detallar bo'yicha progress
    const detailProgress = model.ModelDetails.map(detail => ({
      detail: detail.Detail.name,
      required: detail.required_quantity,
      completed: detail.completed_quantity,
      remaining: detail.required_quantity - detail.completed_quantity,
      percentage: detail.required_quantity > 0 ? 
        (detail.completed_quantity / detail.required_quantity) * 100 : 0,
      timePerUnit: detail.time_per_unit
    }));

    res.status(200).json({
      model: {
        id: model.id,
        name: model.name,
        total_quantity: model.total_quantity,
        status: model.status,
        createdAt: model.createdAt
      },
      progress: {
        totalRequired,
        totalCompleted,
        completionPercentage: completionPercentage.toFixed(2),
        remaining: totalRequired - totalCompleted
      },
      workStatistics: {
        totalWorkLogs,
        totalEarned: totalEarned.toFixed(2),
        totalMinutes: totalMinutes.toFixed(2),
        averagePerUnit: totalCompleted > 0 ? (totalEarned / totalCompleted).toFixed(2) : 0
      },
      detailProgress,
      userDistribution: Object.values(userDistribution).map(dist => ({
        user: `${dist.user.first_name} ${dist.user.last_name}`,
        totalQuantity: dist.totalQuantity,
        totalEarned: dist.totalEarned.toFixed(2),
        percentageOfTotal: totalEarned > 0 ? (dist.totalEarned / totalEarned) * 100 : 0
      })),
      workLogs: model.WorkLogs.map(log => ({
        date: log.work_date,
        user: `${log.User.first_name} ${log.User.last_name}`,
        quantity: log.quantity,
        earned: log.total_price.toFixed(2)
      })).slice(0, 20) // Oxirgi 20 ta ish yozuvi
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};