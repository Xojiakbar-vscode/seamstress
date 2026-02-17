const { User, WorkLog, UserMonthlySummary } = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.createUser = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role, is_active } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ message: "First name, last name, email and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      role: role || "worker",
      is_active: is_active !== undefined ? is_active : true
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "secretkey", {
      expiresIn: "1d"
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// Barcha foydalanuvchilarni olish
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['first_name', 'ASC']]
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ID bo'yicha foydalanuvchini olish
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let updatedData = { ...req.body };

    // Agar password yuborilgan bo‘lsa
    if (req.body.password) {
      updatedData.password = await bcrypt.hash(req.body.password, 10);
    }

    await user.update(updatedData);

    res.status(200).json({
      message: "User updated successfully",
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Foydalanuvchini o'chirish
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = user.toJSON();
    
    // Foydalanuvchiga bog'liq ma'lumotlarni tekshirish
    const workLogs = await WorkLog.count({ where: { user_id: user.id } });
    const summaries = await UserMonthlySummary.count({ where: { user_id: user.id } });
    
    if (workLogs > 0 || summaries > 0) {
      return res.status(400).json({ 
        message: "Cannot delete user with associated work logs or monthly summaries",
        workLogsCount: workLogs,
        summariesCount: summaries
      });
    }

    await user.destroy();
    
    res.status(200).json({
      message: "User deleted successfully",
      deletedUser: userData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Foydalanuvchi qidirish
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${query}%` } },
          { last_name: { [Op.iLike]: `%${query}%` } },
          { role: { [Op.iLike]: `%${query}%` } }
        ]
      }
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Faol foydalanuvchilarni olish
exports.getActiveUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { is_active: true },
      order: [['first_name', 'ASC']]
    });
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Foydalanuvchining ish tarixini olish
exports.getUserWorkHistory = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const workLogs = await WorkLog.findAll({
      where: { user_id: userId },
      order: [['work_date', 'DESC']],
      limit: 100
    });

    res.status(200).json({
      user,
      workHistory: workLogs,
      totalWorkLogs: workLogs.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};