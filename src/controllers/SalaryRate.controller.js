const { SalaryRate } = require("../models");

// Ish haqi stavkasini yaratish
exports.createSalaryRate = async (req, res) => {
  try {
    const { price_per_minute, is_active } = req.body;

    if (!price_per_minute || price_per_minute <= 0) {
      return res.status(400).json({ 
        message: "Price per minute is required and must be greater than 0" 
      });
    }

    // Agar yangi stavka faol bo'lsa, boshqa faol stavkalarni faolsizlashtirish
    if (is_active !== false) {
      await SalaryRate.update(
        { is_active: false },
        { where: { is_active: true } }
      );
    }

    const salaryRate = await SalaryRate.create({
      price_per_minute,
      is_active: is_active !== false ? true : false
    });

    return res.status(201).json({
      message: "Salary rate created successfully",
      salaryRate
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Barcha ish haqi stavkalarini olish
exports.getSalaryRates = async (req, res) => {
  try {
    const salaryRates = await SalaryRate.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(salaryRates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ID bo'yicha ish haqi stavkasini olish
exports.getSalaryRateById = async (req, res) => {
  try {
    const salaryRate = await SalaryRate.findByPk(req.params.id);
    
    if (!salaryRate) {
      return res.status(404).json({ message: "Salary rate not found" });
    }

    res.status(200).json(salaryRate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ish haqi stavkasini yangilash
exports.updateSalaryRate = async (req, res) => {
  try {
    const salaryRate = await SalaryRate.findByPk(req.params.id);
    
    if (!salaryRate) {
      return res.status(404).json({ message: "Salary rate not found" });
    }

    const { price_per_minute, is_active } = req.body;

    // Agar stavka faol bo'lishi o'zgartirilsa, boshqa faol stavkalarni faolsizlashtirish
    if (is_active === true && !salaryRate.is_active) {
      await SalaryRate.update(
        { is_active: false },
        { where: { is_active: true } }
      );
    }

    await salaryRate.update(req.body);
    
    res.status(200).json({
      message: "Salary rate updated successfully",
      salaryRate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ish haqi stavkasini o'chirish
exports.deleteSalaryRate = async (req, res) => {
  try {
    const salaryRate = await SalaryRate.findByPk(req.params.id);
    
    if (!salaryRate) {
      return res.status(404).json({ message: "Salary rate not found" });
    }

    // Faol stavkani o'chirishni oldini olish
    if (salaryRate.is_active) {
      return res.status(400).json({ 
        message: "Cannot delete active salary rate. Deactivate it first." 
      });
    }

    const salaryRateData = salaryRate.toJSON();
    
    await salaryRate.destroy();
    
    res.status(200).json({
      message: "Salary rate deleted successfully",
      deletedSalaryRate: salaryRateData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Faol ish haqi stavkasini olish
exports.getActiveSalaryRate = async (req, res) => {
  try {
    const salaryRate = await SalaryRate.findOne({
      where: { is_active: true }
    });
    
    if (!salaryRate) {
      return res.status(404).json({ message: "No active salary rate found" });
    }

    res.status(200).json(salaryRate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ish haqi stavkasini faollashtirish
exports.activateSalaryRate = async (req, res) => {
  try {
    const salaryRate = await SalaryRate.findByPk(req.params.id);
    
    if (!salaryRate) {
      return res.status(404).json({ message: "Salary rate not found" });
    }

    // Boshqa faol stavkalarni faolsizlashtirish
    await SalaryRate.update(
      { is_active: false },
      { where: { is_active: true } }
    );

    // Tanlangan stavkani faollashtirish
    await salaryRate.update({ is_active: true });
    
    res.status(200).json({
      message: "Salary rate activated successfully",
      salaryRate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ish haqi tarixi
exports.getSalaryRateHistory = async (req, res) => {
  try {
    const salaryRates = await SalaryRate.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'price_per_minute', 'is_active', 'createdAt', 'updatedAt']
    });

    // O'rtacha narxni hisoblash
    const totalRates = salaryRates.length;
    const averagePrice = totalRates > 0 
      ? salaryRates.reduce((sum, rate) => sum + rate.price_per_minute, 0) / totalRates
      : 0;

    // Faol stavka
    const activeRate = salaryRates.find(rate => rate.is_active);

    res.status(200).json({
      history: salaryRates,
      statistics: {
        totalRates,
        averagePrice: averagePrice.toFixed(2),
        activeRate: activeRate || null
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};