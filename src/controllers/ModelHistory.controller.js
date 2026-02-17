const { ModelHistory, Model, ModelDetail, Detail } = require("../models");
const { Op } = require("sequelize");

// Tugallangan modellar tarixini olish
exports.getModelHistories = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const whereClause = {};
    
    if (start_date && end_date) {
      whereClause.closed_at = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      whereClause.closed_at = {
        [Op.gte]: start_date
      };
    } else if (end_date) {
      whereClause.closed_at = {
        [Op.lte]: end_date
      };
    }

    const modelHistories = await ModelHistory.findAll({
      where: whereClause,
      include: [
        { 
          model: Model,
          include: [
            {
              model: ModelDetail,
              include: [Detail]
            }
          ]
        }
      ],
      order: [['closed_at', 'DESC']]
    });
    
    res.status(200).json(modelHistories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ID bo'yicha tarix yozuvini olish
exports.getModelHistoryById = async (req, res) => {
  try {
    const modelHistory = await ModelHistory.findByPk(req.params.id, {
      include: [
        { 
          model: Model,
          include: [
            {
              model: ModelDetail,
              include: [Detail]
            }
          ]
        }
      ]
    });
    
    if (!modelHistory) {
      return res.status(404).json({ message: "Model history not found" });
    }

    res.status(200).json(modelHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Oy bo'yicha tugallangan modellar
exports.getCompletedModelsByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const modelHistories = await ModelHistory.findAll({
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM closed_at')), currentMonth),
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM closed_at')), currentYear)
        ]
      },
      include: [
        { 
          model: Model,
          attributes: ['id', 'name', 'total_quantity']
        }
      ],
      order: [['closed_at', 'DESC']]
    });

    res.status(200).json({
      month: currentMonth,
      year: currentYear,
      totalCompleted: modelHistories.length,
      completedModels: modelHistories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tugallangan modellar statistikasi
exports.getCompletionStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const whereClause = {};
    if (start_date && end_date) {
      whereClause.closed_at = {
        [Op.between]: [start_date, end_date]
      };
    }

    const modelHistories = await ModelHistory.findAll({
      where: whereClause,
      include: [
        { 
          model: Model,
          attributes: ['id', 'name', 'total_quantity']
        }
      ]
    });

    // Statistikalar
    const totalModels = modelHistories.length;
    const totalQuantity = modelHistories.reduce((sum, history) => 
      sum + history.Model.total_quantity, 0
    );

    // Oy bo'yicha guruhlash
    const monthlyStats = {};
    modelHistories.forEach(history => {
      const date = new Date(history.closed_at);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthlyStats[monthYear]) {
        monthlyStats[monthYear] = {
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          count: 0,
          totalQuantity: 0,
          models: []
        };
      }
      
      monthlyStats[monthYear].count++;
      monthlyStats[monthYear].totalQuantity += history.Model.total_quantity;
      monthlyStats[monthYear].models.push(history.Model);
    });

    res.status(200).json({
      statistics: {
        totalModels,
        totalQuantity,
        averageModelsPerMonth: totalModels > 0 ? (totalModels / Object.keys(monthlyStats).length).toFixed(2) : 0
      },
      monthlyStats: Object.values(monthlyStats),
      allHistories: modelHistories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tugallangan modelni o'chirish (faqat admin uchun)
exports.deleteModelHistory = async (req, res) => {
  try {
    const modelHistory = await ModelHistory.findByPk(req.params.id);
    
    if (!modelHistory) {
      return res.status(404).json({ message: "Model history not found" });
    }

    const modelHistoryData = modelHistory.toJSON();
    
    await modelHistory.destroy();
    
    res.status(200).json({
      message: "Model history deleted successfully",
      deletedHistory: modelHistoryData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Oxirgi tugallangan modellar
exports.getRecentCompletedModels = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const modelHistories = await ModelHistory.findAll({
      limit: parseInt(limit),
      include: [
        { 
          model: Model,
          attributes: ['id', 'name', 'total_quantity']
        }
      ],
      order: [['closed_at', 'DESC']]
    });

    res.status(200).json({
      total: modelHistories.length,
      recentCompletedModels: modelHistories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};