const { WorkLog, User, Model, Detail, ModelDetail, SalaryRate, ModelHistory, WorkLogHistory, sequelize } = require("../models");
const { Op } = require("sequelize");

// Ish yozuvi yaratish
exports.createWorkLog = async (req, res) => {
  try {
    const { 
      user_id, 
      model_id, 
      detail_id, 
      quantity, 
      work_date 
    } = req.body;

    // 1. Majburiy maydonlarni tekshirish va formatlash
    if (!user_id || !model_id || !detail_id || !quantity) {
      return res.status(400).json({ 
        message: "Foydalanuvchi, Model, Detal va Miqdor kiritilishi shart!" 
      });
    }

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return res.status(400).json({ 
        message: "Miqdor noldan katta raqam bo'lishi kerak" 
      });
    }

    // Transaction orqali yaratish
    const result = await WorkLog.sequelize.transaction(async (t) => {
      
      // 2. Ma'lumotlar mavjudligini tekshirish (Parallel tekshirish vaqtni tejaydi)
      const [user, model, detail, modelDetail, salaryRate] = await Promise.all([
        User.findByPk(user_id, { transaction: t }),
        Model.findByPk(model_id, { transaction: t }),
        Detail.findByPk(detail_id, { transaction: t }),
        ModelDetail.findOne({ where: { model_id, detail_id }, transaction: t }),
        SalaryRate.findOne({ where: { is_active: true }, transaction: t })
      ]);

      if (!user || !user.is_active) throw new Error("Foydalanuvchi topilmadi yoki nofaol");
      if (!model || model.status !== 'active') throw new Error("Model topilmadi yoki yakunlangan");
      if (!detail) throw new Error("Detal topilmadi");
      if (!modelDetail) throw new Error("Ushbu detal tanlangan modelga tegishli emas");
      if (!salaryRate) throw new Error("Faol ish haqi stavkasi (Salary Rate) topilmadi");

      // 3. Miqdor limitini tekshirish
      // completed_quantity null bo'lsa 0 deb olamiz
      const previousCompleted = Number(modelDetail.completed_quantity || 0);
      const requiredQty = Number(modelDetail.required_quantity || 0);
      const newCompleted = previousCompleted + numQuantity;
      
      if (newCompleted > requiredQty) {
        throw new Error(
          `Miqdor limitdan oshib ketdi. Reja: ${requiredQty}, Bajarilgan: ${previousCompleted}, Kiritilmoqda: ${numQuantity}`
        );
      }

      // 4. Aniq Hisob-kitoblar
      const time_per_unit = Number(modelDetail.time_per_unit || 0);
      const total_minutes = numQuantity * time_per_unit;
      const price_per_minute = Number(salaryRate.price_per_minute || 0);
      const total_price = total_minutes * price_per_minute;

      // 5. Sanani to'g'ri tahlil qilish (Timezone xatosiz)
      const workDate = work_date ? new Date(work_date) : new Date();
      const month = workDate.getMonth() + 1;
      const year = workDate.getFullYear();

      // 6. Ish yozuvini yaratish
      const workLog = await WorkLog.create({
        user_id,
        model_id,
        detail_id,
        quantity: numQuantity,
        time_per_unit,
        total_minutes: Number(total_minutes.toFixed(2)), // Verguldan keyin 2 xona
        price_per_minute,
        total_price: Number(total_price.toFixed(2)),    // Verguldan keyin 2 xona
        work_date: workDate,
        month,
        year
      }, { transaction: t });

      // 7. ModelDetail ni yangilash
      await modelDetail.update({
        completed_quantity: newCompleted
      }, { transaction: t });

      // 8. Model holatini tekshirish
      if (typeof checkAndCompleteModel === 'function') {
        await checkAndCompleteModel(model_id, t);
      }

      return workLog;
    });

    res.status(201).json({
      message: "Ish muvaffaqiyatli saqlandi",
      workLog: result
    });

  } catch (error) {
    // Agar error tranzaksiya ichidan kelgan bo'lsa mantiqiy xato, aks holda 500
    const statusCode = error.message.includes("topilmadi") || error.message.includes("limit") ? 400 : 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

// Barcha ish yozuvlarini olish
exports.getWorkLogs = async (req, res) => {
  try {
    const { 
      user_id, 
      model_id, 
      detail_id, 
      month, 
      year, 
      start_date, 
      end_date 
    } = req.query;
    
    const whereClause = {};
    
    if (user_id) whereClause.user_id = user_id;
    if (model_id) whereClause.model_id = model_id;
    if (detail_id) whereClause.detail_id = detail_id;
    if (month) whereClause.month = month;
    if (year) whereClause.year = year;
    
    if (start_date && end_date) {
      whereClause.work_date = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      whereClause.work_date = {
        [Op.gte]: start_date
      };
    } else if (end_date) {
      whereClause.work_date = {
        [Op.lte]: end_date
      };
    }

    const workLogs = await WorkLog.findAll({
      where: whereClause,
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name'] },
        { model: Model, attributes: ['id', 'name', 'status'] },
        { model: Detail, attributes: ['id', 'name'] }
      ],
      order: [['work_date', 'DESC'], ['createdAt', 'DESC']]
    });
    
    res.status(200).json(workLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ID bo'yicha ish yozuvini olish
exports.getWorkLogById = async (req, res) => {
  try {
    const workLog = await WorkLog.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name'] },
        { model: Model, attributes: ['id', 'name', 'status'] },
        { model: Detail, attributes: ['id', 'name'] }
      ]
    });
    
    if (!workLog) {
      return res.status(404).json({ message: "Work log not found" });
    }

    res.status(200).json(workLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ish yozuvini yangilash
exports.updateWorkLog = async (req, res) => {
  try {
    const workLog = await WorkLog.findByPk(req.params.id);
    
    if (!workLog) {
      return res.status(404).json({ message: "Work log not found" });
    }

    // Ish yozuvini faqat qisqa muddat ichida yangilash mumkin (masalan, 24 soat)
    const hoursSinceCreation = (new Date() - new Date(workLog.createdAt)) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return res.status(400).json({ 
        message: "Cannot update work log after 24 hours" 
      });
    }

    // Quantity o'zgarishi mumkin, lekin boshqa maydonlarni o'zgartirish cheklangan
    const allowedFields = ['quantity', 'work_date'];
    const updateData = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        message: "No valid fields to update. Only quantity and work_date can be updated." 
      });
    }

    await workLog.update(updateData);
    
    res.status(200).json({
      message: "Work log updated successfully",
      workLog
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ish yozuvini o'chirish
exports.deleteWorkLog = async (req, res) => {
  try {
    const workLog = await WorkLog.findByPk(req.params.id);
    
    if (!workLog) {
      return res.status(404).json({ message: "Work log not found" });
    }

    // Ish yozuvini faqat qisqa muddat ichida o'chirish mumkin (masalan, 24 soat)
    const hoursSinceCreation = (new Date() - new Date(workLog.createdAt)) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return res.status(400).json({ 
        message: "Cannot delete work log after 24 hours" 
      });
    }

    const workLogData = workLog.toJSON();
    
    // Transaction bilan o'chirish
    await WorkLog.sequelize.transaction(async (t) => {
      // ModelDetail ni yangilash (completed_quantity kamaytirish)
      const modelDetail = await ModelDetail.findOne({
        where: { 
          model_id: workLog.model_id, 
          detail_id: workLog.detail_id 
        },
        transaction: t
      });

      if (modelDetail) {
        const newCompleted = Math.max(0, modelDetail.completed_quantity - workLog.quantity);
        await modelDetail.update({
          completed_quantity: newCompleted
        }, { transaction: t });
      }

      // Ish yozuvini o'chirish
      await workLog.destroy({ transaction: t });
    });

    res.status(200).json({
      message: "Work log deleted successfully",
      deletedWorkLog: workLogData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kunlik ish yozuvlarini olish
exports.getDailyWorkLogs = async (req, res) => {
  try {
    const { date } = req.query;
    const workDate = date || new Date().toISOString().split('T')[0];

    const workLogs = await WorkLog.findAll({
      where: { work_date: workDate },
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name'] },
        { model: Model, attributes: ['id', 'name'] },
        { model: Detail, attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Statistikalar
    const totalQuantity = workLogs.reduce((sum, log) => sum + log.quantity, 0);
    const totalMinutes = workLogs.reduce((sum, log) => sum + log.total_minutes, 0);
    const totalEarned = workLogs.reduce((sum, log) => sum + log.total_price, 0);

    res.status(200).json({
      date: workDate,
      totalWorkLogs: workLogs.length,
      statistics: {
        totalQuantity,
        totalMinutes: totalMinutes.toFixed(2),
        totalEarned: totalEarned.toFixed(2)
      },
      workLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Foydalanuvchi bo'yicha kunlik ish yozuvlari
exports.getUserDailyWorkLogs = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { date } = req.query;
    
    const workDate = date || new Date().toISOString().split('T')[0];

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const workLogs = await WorkLog.findAll({
      where: { 
        user_id: userId,
        work_date: workDate
      },
      include: [
        { model: Model, attributes: ['id', 'name'] },
        { model: Detail, attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Statistikalar
    const totalQuantity = workLogs.reduce((sum, log) => sum + log.quantity, 0);
    const totalMinutes = workLogs.reduce((sum, log) => sum + log.total_minutes, 0);
    const totalEarned = workLogs.reduce((sum, log) => sum + log.total_price, 0);

    res.status(200).json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name
      },
      date: workDate,
      statistics: {
        totalWorkLogs: workLogs.length,
        totalQuantity,
        totalMinutes: totalMinutes.toFixed(2),
        totalEarned: totalEarned.toFixed(2)
      },
      workLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Oylik statistikalar
exports.getMonthlyStatistics = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const workLogs = await WorkLog.findAll({
      where: { 
        month: currentMonth,
        year: currentYear
      },
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name'] },
        { model: Model, attributes: ['id', 'name'] }
      ]
    });

    // Userlar bo'yicha guruhlash
    const userStats = {};
    let totalMinutes = 0;
    let totalEarned = 0;

    workLogs.forEach(log => {
      const userId = log.user_id;
      if (!userStats[userId]) {
        userStats[userId] = {
          user: log.User,
          totalQuantity: 0,
          totalMinutes: 0,
          totalEarned: 0,
          workLogs: []
        };
      }

      userStats[userId].totalQuantity += log.quantity;
      userStats[userId].totalMinutes += log.total_minutes;
      userStats[userId].totalEarned += log.total_price;
      userStats[userId].workLogs.push(log);

      totalMinutes += log.total_minutes;
      totalEarned += log.total_price;
    });

    res.status(200).json({
      month: currentMonth,
      year: currentYear,
      totalWorkLogs: workLogs.length,
      totalMinutes: totalMinutes.toFixed(2),
      totalEarned: totalEarned.toFixed(2),
      userStatistics: Object.values(userStats).map(stats => ({
        user: stats.user,
        totalQuantity: stats.totalQuantity,
        totalMinutes: stats.totalMinutes.toFixed(2),
        totalEarned: stats.totalEarned.toFixed(2),
        workLogsCount: stats.workLogs.length
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Yordamchi funksiya: Modelni tekshirish va tugatish
async function checkAndCompleteModel(modelId, transaction) {
  const model = await Model.findByPk(modelId, {
    include: [ModelDetail],
    transaction
  });

  if (!model || model.status === 'completed') {
    return;
  }

  // Barcha detallar to'liq bajarilganmi tekshirish
  const allCompleted = model.ModelDetails.every(detail => 
    detail.completed_quantity >= detail.required_quantity
  );

  if (allCompleted) {
    // Modelni completed holatiga o'tkazish
    await model.update({ status: 'completed' }, { transaction });

    // Tarixga yozish
    await ModelHistory.create({
      model_id: modelId,
      closed_at: new Date()
    }, { transaction });
  }
}

exports.archiveAllWorkLogs = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // 1. Barcha mavjud ish yozuvlarini olish
    const allLogs = await WorkLog.findAll({ transaction });

    if (allLogs.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "O'chirish uchun ma'lumot topilmadi" });
    }

    // 2. Ma'lumotlarni History modeliga moslab tayyorlash
    const historyData = allLogs.map(log => ({
      original_worklog_id: log.id,
      user_id: log.user_id,
      model_id: log.model_id,
      detail_id: log.detail_id,
      quantity: log.quantity,
      total_price: log.total_price,
      work_date: log.work_date,
      reason: req.body.reason || "Barchasini tozalash (Massive Cleanup)"
    }));

    // 3. Tarix jadvaliga ommaviy yozish (Bulk Create)
    await WorkLogHistory.bulkCreate(historyData, { transaction });

    // 4. Asosiy WorkLog jadvalini butunlay tozalash
    // truncate: true jadvalni nollab beradi (Auto-increment ham 1 dan boshlanadi)
    await WorkLog.destroy({
      where: {},
      truncate: false, // Agar FK constraint bo'lsa truncate true ishlamasligi mumkin
      transaction
    });

    // Hammasi yaxshi bo'lsa, saqlash
    await transaction.commit();

    res.status(200).json({
      message: "Barcha ish yozuvlari tarixga ko'chirildi va muvaffaqiyatli o'chirildi",
      archivedCount: allLogs.length
    });

  } catch (error) {
    // Xato bo'lsa, orqaga qaytarish
    await transaction.rollback();
    res.status(500).json({ message: "Xatolik yuz berdi", error: error.message });
  }
};

exports.getArchivedWorkLogs = async (req, res) => {
  try {
    const { user_id, model_id, start_date, end_date } = req.query;
    
    const whereClause = {};
    
    // Filtrlash mantiqi
    if (user_id) whereClause.user_id = user_id;
    if (model_id) whereClause.model_id = model_id;
    
    if (start_date && end_date) {
      whereClause.work_date = { [Op.between]: [start_date, end_date] };
    }

    const archivedLogs = await WorkLogHistory.findAll({
      where: whereClause,
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name'] },
        { model: Model, attributes: ['id', 'name'] },
        { model: Detail, attributes: ['id', 'name'] }
      ],
      order: [['archived_at', 'DESC']] // Eng oxirgi arxivlanganlar birinchi
    });

    res.status(200).json({
      success: true,
      count: archivedLogs.length,
      data: archivedLogs
    });
  } catch (error) {
    res.status(500).json({ message: "Arxivni yuklashda xatolik", error: error.message });
  }
};

exports.getUserArchive = async (req, res) => {
  try {
    const { userId } = req.params;

    const history = await WorkLogHistory.findAll({
      where: { user_id: userId },
      include: [
        { model: Model, attributes: ['name'] },
        { model: Detail, attributes: ['name'] }
      ],
      order: [['work_date', 'DESC']]
    });

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteArchivedWorkLog = async (req, res) => {
  try {
    const { id } = req.params;  
    const archivedLog = await WorkLogHistory.findByPk(id);

    if (!archivedLog) {
      return res.status(404).json({ message: "Arxivdagi ish yozuvi topilmadi" });
    }
    
    await archivedLog.destroy();
    res.status(200).json({ message: "Arxivdagi ish yozuvi muvaffaqiyatli o'chirildi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};