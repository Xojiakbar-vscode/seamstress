const { Model, ModelDetail, Detail, WorkLog, ModelHistory } = require("../models");
const { Op, } = require("sequelize");
const {sequelize} = require('../config/database');

// Model yaratish
exports.createModel = async (req, res) => {
  try {
    const { name, total_quantity, status, details } = req.body;

    if (!name || !total_quantity) {
      return res.status(400).json({ message: "Name and total quantity are required" });
    }

    if (total_quantity <= 0) {
      return res.status(400).json({ message: "Total quantity must be greater than 0" });
    }

    // Transaction orqali model va detailarni bir vaqtda yaratish
    const result = await Model.sequelize.transaction(async (t) => {
      // Model yaratish
      const model = await Model.create({
        name,
        total_quantity,
        status: status || 'active'
      }, { transaction: t });

      // Agar detallar berilsa
      if (details && Array.isArray(details) && details.length > 0) {
        const modelDetails = [];
        
        for (const detail of details) {
          // Detail mavjudligini tekshirish
          const detailExists = await Detail.findByPk(detail.detail_id, { transaction: t });
          if (!detailExists) {
            throw new Error(`Detail with ID ${detail.detail_id} not found`);
          }

          if (detail.required_quantity <= 0) {
            throw new Error(`Required quantity must be greater than 0 for detail ${detail.detail_id}`);
          }

          if (!detail.time_per_unit || detail.time_per_unit <= 0) {
            throw new Error(`Time per unit must be greater than 0 for detail ${detail.detail_id}`);
          }

          const modelDetail = await ModelDetail.create({
            model_id: model.id,
            detail_id: detail.detail_id,
            required_quantity: detail.required_quantity,
            time_per_unit: detail.time_per_unit
          }, { transaction: t });

          modelDetails.push(modelDetail);
        }
        
        model.ModelDetails = modelDetails;
      }

      return model;
    });

    res.status(201).json({
      message: "Model created successfully",
      model: result
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Barcha modellarni olish
exports.getModels = async (req, res) => {
  try {
    const { status } = req.query;
    
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const models = await Model.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [ModelDetail]
    });
    
    res.status(200).json(models);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ID bo'yicha modelni olish (batafsil ma'lumot bilan)
exports.getModelById = async (req, res) => {
  try {
    const model = await Model.findByPk(req.params.id, {
      include: [
        {
          model: ModelDetail,
          include: [Detail]
        },
        {
          model: WorkLog,
          include: ['User', 'Detail']
        }
      ]
    });
    
    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    res.status(200).json(model);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Modelni yangilash
exports.updateModel = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, total_quantity, status, details } = req.body;

    const model = await Model.findByPk(req.params.id, { transaction });

    if (!model) {
      await transaction.rollback();
      return res.status(404).json({ message: "Model not found" });
    }

    if (model.status === 'completed') {
      await transaction.rollback();
      return res.status(400).json({ message: "Cannot update completed model" });
    }

    // Modelni update qilish
    await model.update({ name, total_quantity, status }, { transaction });

    // Eski detailsni o'chirish
    await ModelDetail.destroy({ where: { model_id: model.id }, transaction });

    // Yangi detailsni qo'shish
    if (Array.isArray(details) && details.length > 0) {
      const newDetails = details.map(d => ({
        model_id: model.id,
        detail_id: d.detail_id,
        required_quantity: d.required_quantity,
        time_per_unit: d.time_per_unit
      }));

      await ModelDetail.bulkCreate(newDetails, { transaction });
    }

    await transaction.commit();

    const updatedModel = await Model.findByPk(model.id, {
      include: ModelDetail
    });

    res.status(200).json({
      message: "Model updated successfully",
      model: updatedModel
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};


// Modelni o'chirish (bog'liqliklarni tekshirmasdan tozalab yuborish)
exports.deleteModel = async (req, res) => {
  try {
    const model = await Model.findByPk(req.params.id);
    
    if (!model) {
      return res.status(404).json({ message: "Model topilmadi" });
    }

    const modelData = model.toJSON();

    // Transaction bilan barcha bog'liq ma'lumotlarni birga o'chirish
    await Model.sequelize.transaction(async (t) => {
      
      // 1. Modelga bog'langan detallarni o'chirish
      await ModelDetail.destroy({
        where: { model_id: model.id },
        transaction: t
      });

      // 2. Modelga bog'langan ish jurnallarini (WorkLog) o'chirish
      await WorkLog.destroy({
        where: { model_id: model.id },
        transaction: t
      });

      // 3. Model tarixini (ModelHistory) o'chirish
      await ModelHistory.destroy({
        where: { model_id: model.id },
        transaction: t
      });

      // 4. Asosiy modelning o'zini o'chirish
      await model.destroy({ transaction: t });
    });

    res.status(200).json({
      message: "Model va unga bog'liq barcha ma'lumotlar muvaffaqiyatli o'chirildi",
      deletedModel: modelData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Modellarni qidirish
exports.searchModels = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const models = await Model.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { status: { [Op.iLike]: `%${query}%` } }
        ]
      }
    });

    res.status(200).json(models);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Modelga detal qo'shish
exports.addDetailToModel = async (req, res) => {
  try {
    const modelId = req.params.modelId;
    const { detail_id, required_quantity, time_per_unit } = req.body;

    const model = await Model.findByPk(modelId);
    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    if (model.status === 'completed') {
      return res.status(400).json({ message: "Cannot add detail to completed model" });
    }

    const detail = await Detail.findByPk(detail_id);
    if (!detail) {
      return res.status(404).json({ message: "Detail not found" });
    }

    // Detal allaqachon modelga qo'shilganmi tekshirish
    const existingDetail = await ModelDetail.findOne({
      where: { model_id: modelId, detail_id }
    });

    if (existingDetail) {
      return res.status(400).json({ message: "Detail already added to this model" });
    }

    const modelDetail = await ModelDetail.create({
      model_id: modelId,
      detail_id,
      required_quantity,
      time_per_unit
    });

    res.status(201).json({
      message: "Detail added to model successfully",
      modelDetail
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Modelni tugatish (complete qilish)
exports.completeModel = async (req, res) => {
  try {
    const modelId = req.params.id;
    
    const model = await Model.findByPk(modelId, {
      include: [ModelDetail]
    });
    
    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    if (model.status === 'completed') {
      return res.status(400).json({ message: "Model is already completed" });
    }

    // Barcha detallar to'liq bajarilganmi tekshirish
    const allCompleted = model.ModelDetails.every(detail => 
      detail.completed_quantity >= detail.required_quantity
    );

    if (!allCompleted) {
      return res.status(400).json({ message: "Not all details are completed" });
    }

    // Transaction bilan modelni tugatish va tarixga yozish
    await Model.sequelize.transaction(async (t) => {
      // Modelni completed holatiga o'tkazish
      await model.update({ status: 'completed' }, { transaction: t });

      // Tarixga yozish
      await ModelHistory.create({
        model_id: modelId,
        closed_at: new Date()
      }, { transaction: t });
    });

    res.status(200).json({
      message: "Model completed successfully",
      model: await Model.findByPk(modelId)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Modelning bajarilish foizini olish
exports.getModelProgress = async (req, res) => {
  try {
    const modelId = req.params.id;
    
    const model = await Model.findByPk(modelId, {
      include: [ModelDetail]
    });
    
    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    let totalRequired = 0;
    let totalCompleted = 0;
    
    model.ModelDetails.forEach(detail => {
      totalRequired += detail.required_quantity;
      totalCompleted += detail.completed_quantity;
    });

    const progressPercentage = totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0;

    res.status(200).json({
      model,
      progress: {
        totalRequired,
        totalCompleted,
        percentage: progressPercentage.toFixed(2),
        details: model.ModelDetails.map(detail => ({
          detail_id: detail.detail_id,
          required: detail.required_quantity,
          completed: detail.completed_quantity,
          percentage: detail.required_quantity > 0 ? 
            (detail.completed_quantity / detail.required_quantity) * 100 : 0
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};