const { Detail, ModelDetail, WorkLog } = require("../models");
const { Op } = require("sequelize");

// Detal yaratish
exports.createDetail = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Detail name is required" });
    }

    // Detal nomi unique bo'lishi kerak
    const existingDetail = await Detail.findOne({ where: { name } });
    if (existingDetail) {
      return res.status(400).json({ message: "Detail with this name already exists" });
    }

    const detail = await Detail.create({ name });
    
    return res.status(201).json({
      message: "Detail created successfully",
      detail
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Barcha detallarni olish
exports.getDetails = async (req, res) => {
  try {
    const details = await Detail.findAll({
      order: [['name', 'ASC']]
    });
    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ID bo'yicha detalni olish
exports.getDetailById = async (req, res) => {
  try {
    const detail = await Detail.findByPk(req.params.id);
    
    if (!detail) {
      return res.status(404).json({ message: "Detail not found" });
    }

    res.status(200).json(detail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Detalni yangilash
exports.updateDetail = async (req, res) => {
  try {
    const detail = await Detail.findByPk(req.params.id);
    
    if (!detail) {
      return res.status(404).json({ message: "Detail not found" });
    }

    const { name } = req.body;
    
    // Agar nom o'zgartirilsa, unique tekshirish
    if (name && name !== detail.name) {
      const existingDetail = await Detail.findOne({ where: { name } });
      if (existingDetail) {
        return res.status(400).json({ message: "Detail with this name already exists" });
      }
    }

    await detail.update(req.body);
    
    res.status(200).json({
      message: "Detail updated successfully",
      detail
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Detalni o'chirish
exports.deleteDetail = async (req, res) => {
  try {
    const detail = await Detail.findByPk(req.params.id);
    
    if (!detail) {
      return res.status(404).json({ message: "Detail not found" });
    }

    const detailData = detail.toJSON();
    
    // Detalga bog'liq ma'lumotlarni tekshirish
    const modelDetails = await ModelDetail.count({ where: { detail_id: detail.id } });
    const workLogs = await WorkLog.count({ where: { detail_id: detail.id } });
    
    if (modelDetails > 0 || workLogs > 0) {
      return res.status(400).json({ 
        message: "Cannot delete detail with associated models or work logs",
        modelDetailsCount: modelDetails,
        workLogsCount: workLogs
      });
    }

    await detail.destroy();
    
    res.status(200).json({
      message: "Detail deleted successfully",
      deletedDetail: detailData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Detallarni qidirish
exports.searchDetails = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const details = await Detail.findAll({
      where: {
        name: { [Op.iLike]: `%${query}%` }
      }
    });

    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Detal statistikasini olish
exports.getDetailStatistics = async (req, res) => {
  try {
    const detailId = req.params.id;
    
    const detail = await Detail.findByPk(detailId);
    if (!detail) {
      return res.status(404).json({ message: "Detail not found" });
    }

    // Bu detal qaysi modellarda ishlatilgan
    const modelDetails = await ModelDetail.findAll({
      where: { detail_id: detailId },
      include: ['Model']
    });

    // Bu detal uchun ish yozuvlari
    const workLogs = await WorkLog.findAll({
      where: { detail_id: detailId },
      include: ['User', 'Model']
    });

    // Umumiy ishlangan miqdor
    const totalQuantity = workLogs.reduce((sum, log) => sum + log.quantity, 0);

    res.status(200).json({
      detail,
      usedInModels: modelDetails.map(md => ({
        model: md.Model,
        required_quantity: md.required_quantity,
        completed_quantity: md.completed_quantity
      })),
      workLogsSummary: {
        totalWorkLogs: workLogs.length,
        totalQuantity,
        workLogs: workLogs.slice(0, 50) // Oxirgi 50 ta yozuv
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};