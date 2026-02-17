const { 
  WorkLog, 
  User, 
  Model, 
  Detail, 
  UserMonthlySummary,
  MonthlyClosure
} = require("../models");
const { Op } = require("sequelize");
const ExcelJS = require('exceljs');

// Oylik hisobot yaratish (Excel formatida)
exports.generateMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.params;

    // Oyni yopish ma'lumotlarini tekshirish
    const monthlyClosure = await MonthlyClosure.findOne({
      where: { month: parseInt(month), year: parseInt(year) }
    });

    if (!monthlyClosure) {
      return res.status(400).json({ 
        message: `Month ${month}/${year} is not closed. Please close the month first.` 
      });
    }

    // Foydalanuvchi summariyalarini olish
    const userSummaries = await UserMonthlySummary.findAll({
      where: { 
        month: parseInt(month), 
        year: parseInt(year) 
      },
      include: [User],
      order: [['total_earned', 'DESC']]
    });

    // Ish yozuvlarini olish (batafsil)
    const workLogs = await WorkLog.findAll({
      where: { 
        month: parseInt(month), 
        year: parseInt(year) 
      },
      include: [User, Model, Detail],
      order: [['work_date', 'ASC'], ['user_id', 'ASC']]
    });

    // Excel workbook yaratish
    const workbook = new ExcelJS.Workbook();
    
    // 1. Umumiy statistikalar sahifasi
    const summarySheet = workbook.addWorksheet('Umumiy Statistikalar');
    
    // Sarlavhalar
    summarySheet.columns = [
      { header: 'T/r', key: 'index', width: 10 },
      { header: "Ko'rsatkich", key: 'indicator', width: 40 },
      { header: 'Qiymat', key: 'value', width: 30 }
    ];

    // Ma'lumotlar
    summarySheet.addRow({ index: 1, indicator: 'Oy', value: `${month}/${year}` });
    summarySheet.addRow({ index: 2, indicator: 'Yopilgan sana', value: monthlyClosure.closed_at.toLocaleDateString() });
    summarySheet.addRow({ index: 3, indicator: 'Yopgan shaxs', value: `${monthlyClosure.ClosedByUser?.first_name} ${monthlyClosure.ClosedByUser?.last_name}` });
    summarySheet.addRow({ index: 4, indicator: 'Jami foydalanuvchilar', value: userSummaries.length });
    
    const totalEarned = userSummaries.reduce((sum, s) => sum + s.total_earned, 0);
    const totalMinutes = userSummaries.reduce((sum, s) => sum + s.total_minutes, 0);
    
    summarySheet.addRow({ index: 5, indicator: 'Jami ish vaqti (daqiqa)', value: totalMinutes.toFixed(2) });
    summarySheet.addRow({ index: 6, indicator: 'Jami ish haqi', value: totalEarned.toFixed(2) });
    summarySheet.addRow({ index: 7, indicator: "O'rtacha ish haqi", value: (totalEarned / userSummaries.length).toFixed(2) });

    // 2. Foydalanuvchilar bo'yicha hisobot sahifasi
    const usersSheet = workbook.addWorksheet('Foydalanuvchilar bo\'yicha');
    
    usersSheet.columns = [
      { header: 'T/r', key: 'index', width: 10 },
      { header: 'F.I.Sh', key: 'name', width: 30 },
      { header: 'Jami daqiqa', key: 'total_minutes', width: 20 },
      { header: 'Jami ish haqi', key: 'total_earned', width: 20 },
      { header: "O'rtacha kunlik", key: 'daily_avg', width: 20 }
    ];

    userSummaries.forEach((summary, index) => {
      usersSheet.addRow({
        index: index + 1,
        name: `${summary.User.first_name} ${summary.User.last_name}`,
        total_minutes: summary.total_minutes.toFixed(2),
        total_earned: summary.total_earned.toFixed(2),
        daily_avg: (summary.total_earned / 30).toFixed(2) // Taxminiy
      });
    });

    // 3. Batafsil ish yozuvlari sahifasi
    const detailsSheet = workbook.addWorksheet('Batafsil ish yozuvlari');
    
    detailsSheet.columns = [
      { header: 'Sana', key: 'date', width: 15 },
      { header: 'F.I.Sh', key: 'user', width: 25 },
      { header: 'Model', key: 'model', width: 25 },
      { header: 'Detail', key: 'detail', width: 25 },
      { header: 'Miqdor', key: 'quantity', width: 15 },
      { header: 'Birlik vaqti', key: 'time_per_unit', width: 15 },
      { header: 'Jami daqiqa', key: 'total_minutes', width: 15 },
      { header: 'Narx/daqika', key: 'price_per_minute', width: 15 },
      { header: 'Jami summa', key: 'total_price', width: 20 }
    ];

    workLogs.forEach(log => {
      detailsSheet.addRow({
        date: log.work_date,
        user: `${log.User.first_name} ${log.User.last_name}`,
        model: log.Model.name,
        detail: log.Detail.name,
        quantity: log.quantity,
        time_per_unit: log.time_per_unit,
        total_minutes: log.total_minutes.toFixed(2),
        price_per_minute: log.price_per_minute.toFixed(2),
        total_price: log.total_price.toFixed(2)
      });
    });

    // Excel faylni yuklab olish uchun tayyorlash
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=monthly_report_${month}_${year}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Foydalanuvchi bo'yicha hisobot
exports.generateUserReport = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { start_date, end_date } = req.query;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter
    const whereClause = { user_id: userId };
    if (start_date && end_date) {
      whereClause.work_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    // Ish yozuvlarini olish
    const workLogs = await WorkLog.findAll({
      where: whereClause,
      include: [Model, Detail],
      order: [['work_date', 'ASC']]
    });

    // Excel workbook yaratish
    const workbook = new ExcelJS.Workbook();
    
    // 1. Umumiy ma'lumotlar sahifasi
    const summarySheet = workbook.addWorksheet('Umumiy ma\'lumotlar');
    
    summarySheet.columns = [
      { header: 'Maydon', key: 'field', width: 30 },
      { header: 'Qiymat', key: 'value', width: 40 }
    ];

    const totalQuantity = workLogs.reduce((sum, log) => sum + log.quantity, 0);
    const totalEarned = workLogs.reduce((sum, log) => sum + log.total_price, 0);
    const totalMinutes = workLogs.reduce((sum, log) => sum + log.total_minutes, 0);
    const period = start_date && end_date ? 
      `${start_date} dan ${end_date} gacha` : 'Barcha vaqt';

    summarySheet.addRow({ field: 'F.I.Sh', value: `${user.first_name} ${user.last_name}` });
    summarySheet.addRow({ field: 'Davr', value: period });
    summarySheet.addRow({ field: 'Jami ishlar soni', value: workLogs.length });
    summarySheet.addRow({ field: 'Jami detallar soni', value: totalQuantity });
    summarySheet.addRow({ field: 'Jami ish vaqti (daqiqa)', value: totalMinutes.toFixed(2) });
    summarySheet.addRow({ field: 'Jami ish haqi', value: totalEarned.toFixed(2) });
    summarySheet.addRow({ field: "O'rtacha kunlik", value: (totalEarned / 30).toFixed(2) });

    // 2. Batafsil ish yozuvlari sahifasi
    const detailsSheet = workbook.addWorksheet('Ish yozuvlari');
    
    detailsSheet.columns = [
      { header: 'Sana', key: 'date', width: 15 },
      { header: 'Model', key: 'model', width: 25 },
      { header: 'Detail', key: 'detail', width: 25 },
      { header: 'Miqdor', key: 'quantity', width: 15 },
      { header: 'Birlik vaqti', key: 'time_per_unit', width: 15 },
      { header: 'Jami daqiqa', key: 'total_minutes', width: 15 },
      { header: 'Narx/daqika', key: 'price_per_minute', width: 15 },
      { header: 'Jami summa', key: 'total_price', width: 20 }
    ];

    workLogs.forEach(log => {
      detailsSheet.addRow({
        date: log.work_date,
        model: log.Model.name,
        detail: log.Detail.name,
        quantity: log.quantity,
        time_per_unit: log.time_per_unit,
        total_minutes: log.total_minutes.toFixed(2),
        price_per_minute: log.price_per_minute.toFixed(2),
        total_price: log.total_price.toFixed(2)
      });
    });

    // 3. Model bo'yicha yig'indilar sahifasi
    const modelStats = {};
    workLogs.forEach(log => {
      if (!modelStats[log.model_id]) {
        modelStats[log.model_id] = {
          modelName: log.Model.name,
          totalQuantity: 0,
          totalEarned: 0
        };
      }
      modelStats[log.model_id].totalQuantity += log.quantity;
      modelStats[log.model_id].totalEarned += log.total_price;
    });

    const modelsSheet = workbook.addWorksheet('Model bo\'yicha');
    
    modelsSheet.columns = [
      { header: 'Model', key: 'model', width: 30 },
      { header: 'Jami detallar', key: 'total_quantity', width: 20 },
      { header: 'Jami ish haqi', key: 'total_earned', width: 20 },
      { header: 'Foiz', key: 'percentage', width: 15 }
    ];

    Object.values(modelStats).forEach((stat, index) => {
      const percentage = totalEarned > 0 ? (stat.totalEarned / totalEarned) * 100 : 0;
      modelsSheet.addRow({
        model: stat.modelName,
        total_quantity: stat.totalQuantity,
        total_earned: stat.totalEarned.toFixed(2),
        percentage: percentage.toFixed(2)
      });
    });

    // Excel faylni yuklab olish uchun tayyorlash
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=user_report_${user.first_name}_${user.last_name}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Model bo'yicha hisobot
exports.generateModelReport = async (req, res) => {
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
          include: [User, Detail]
        }
      ]
    });

    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    // Excel workbook yaratish
    const workbook = new ExcelJS.Workbook();
    
    // 1. Model ma'lumotlari sahifasi
    const modelSheet = workbook.addWorksheet('Model ma\'lumotlari');
    
    modelSheet.columns = [
      { header: 'Maydon', key: 'field', width: 30 },
      { header: 'Qiymat', key: 'value', width: 40 }
    ];

    const totalRequired = model.ModelDetails.reduce((sum, detail) => sum + detail.required_quantity, 0);
    const totalCompleted = model.ModelDetails.reduce((sum, detail) => sum + detail.completed_quantity, 0);
    const completionPercentage = totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0;
    const totalEarned = model.WorkLogs.reduce((sum, log) => sum + log.total_price, 0);

    modelSheet.addRow({ field: 'Model nomi', value: model.name });
    modelSheet.addRow({ field: 'Jami miqdor', value: model.total_quantity });
    modelSheet.addRow({ field: 'Holati', value: model.status });
    modelSheet.addRow({ field: 'Yaratilgan sana', value: model.createdAt.toLocaleDateString() });
    modelSheet.addRow({ field: 'Kerakli detallar', value: totalRequired });
    modelSheet.addRow({ field: 'Bajarilgan detallar', value: totalCompleted });
    modelSheet.addRow({ field: 'Bajarilish foizi', value: `${completionPercentage.toFixed(2)}%` });
    modelSheet.addRow({ field: 'Jami ish haqi', value: totalEarned.toFixed(2) });

    // 2. Detallar bo'yicha progress sahifasi
    const detailsSheet = workbook.addWorksheet('Detallar bo\'yicha progress');
    
    detailsSheet.columns = [
      { header: 'Detail', key: 'detail', width: 30 },
      { header: 'Kerakli miqdor', key: 'required', width: 20 },
      { header: 'Bajarilgan miqdor', key: 'completed', width: 20 },
      { header: 'Qolgan miqdor', key: 'remaining', width: 20 },
      { header: 'Foiz', key: 'percentage', width: 15 },
      { header: 'Birlik vaqti (daqika)', key: 'time_per_unit', width: 20 }
    ];

    model.ModelDetails.forEach(detail => {
      const percentage = detail.required_quantity > 0 ? 
        (detail.completed_quantity / detail.required_quantity) * 100 : 0;
      
      detailsSheet.addRow({
        detail: detail.Detail.name,
        required: detail.required_quantity,
        completed: detail.completed_quantity,
        remaining: detail.required_quantity - detail.completed_quantity,
        percentage: percentage.toFixed(2),
        time_per_unit: detail.time_per_unit
      });
    });

    // 3. Foydalanuvchilar bo'yicha ish yozuvlari sahifasi
    const usersSheet = workbook.addWorksheet('Foydalanuvchilar bo\'yicha');
    
    usersSheet.columns = [
      { header: 'F.I.Sh', key: 'name', width: 30 },
      { header: 'Jami detallar', key: 'total_quantity', width: 20 },
      { header: 'Jami daqiqa', key: 'total_minutes', width: 20 },
      { header: 'Jami ish haqi', key: 'total_earned', width: 20 },
      { header: 'Foiz', key: 'percentage', width: 15 }
    ];

    // Foydalanuvchilar bo'yicha guruhlash
    const userStats = {};
    model.WorkLogs.forEach(log => {
      if (!userStats[log.user_id]) {
        userStats[log.user_id] = {
          user: log.User,
          totalQuantity: 0,
          totalMinutes: 0,
          totalEarned: 0
        };
      }
      userStats[log.user_id].totalQuantity += log.quantity;
      userStats[log.user_id].totalMinutes += log.total_minutes;
      userStats[log.user_id].totalEarned += log.total_price;
    });

    Object.values(userStats).forEach(stat => {
      const percentage = totalEarned > 0 ? (stat.totalEarned / totalEarned) * 100 : 0;
      
      usersSheet.addRow({
        name: `${stat.user.first_name} ${stat.user.last_name}`,
        total_quantity: stat.totalQuantity,
        total_minutes: stat.totalMinutes.toFixed(2),
        total_earned: stat.totalEarned.toFixed(2),
        percentage: percentage.toFixed(2)
      });
    });

    // Excel faylni yuklab olish uchun tayyorlash
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=model_report_${model.name}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};