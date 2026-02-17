const { Router } = require("express");
const user = Router();
const userController = require("../controllers/user.controller");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Foydalanuvchilar boshqarish uchun API endpointlar
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Yangi foydalanuvchi yaratish
 *     tags: [Users]
 *     description: Yangi foydalanuvchi ma'lumotlarini yaratish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [manager, cashier, worker]
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Foydalanuvchi muvaffaqiyatli yaratildi
 *       400:
 *         description: Validatsiya xatosi
 *       500:
 *         description: Ichki server xatosi
 */
user.post("/", userController.createUser);

user.post("/login", userController.loginUser);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Barcha foydalanuvchilarni olish
 *     tags: [Users]
 *     description: Barcha foydalanuvchilar ro'yxatini olish
 *     responses:
 *       200:
 *         description: Barcha foydalanuvchilar qaytarildi
 *       500:
 *         description: Ichki server xatosi
 */
user.get("/", userController.getUsers);

/**
 * @swagger
 * /users/active:
 *   get:
 *     summary: Faol foydalanuvchilarni olish
 *     tags: [Users]
 *     description: Faol holatdagi foydalanuvchilarni olish
 *     responses:
 *       200:
 *         description: Faol foydalanuvchilar qaytarildi
 *       500:
 *         description: Ichki server xatosi
 */
user.get("/active", userController.getActiveUsers);

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Foydalanuvchi qidirish
 *     tags: [Users]
 *     description: Ism, familiya yoki rol bo'yicha qidirish
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Qidiruv uchun matn
 *     responses:
 *       200:
 *         description: Qidiruv natijalari qaytdi
 *       400:
 *         description: Qidiruv matni kiritilmagan
 *       500:
 *         description: Server xatosi
 */
user.get("/search", userController.searchUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: ID bo'yicha foydalanuvchi olish
 *     tags: [Users]
 *     description: Foydalanuvchini ID bo'yicha qidirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID
 *     responses:
 *       200:
 *         description: Foydalanuvchi topildi
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
user.get("/:id", userController.getUserById);

/**
 * @swagger
 * /users/{id}/work-history:
 *   get:
 *     summary: Foydalanuvchining ish tarixini olish
 *     tags: [Users]
 *     description: Foydalanuvchining barcha ish yozuvlarini olish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID
 *     responses:
 *       200:
 *         description: Ish tarixi qaytarildi
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
user.get("/:id/work-history", userController.getUserWorkHistory);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Foydalanuvchi ma'lumotlarini yangilash
 *     tags: [Users]
 *     description: Foydalanuvchini ID bo'yicha yangilash
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               role: { type: string, enum: [manager, cashier, worker] }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Foydalanuvchi muvaffaqiyatli yangilandi
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
user.put("/:id", userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Foydalanuvchi o'chirish
 *     tags: [Users]
 *     description: Foydalanuvchini ID bo'yicha o'chirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: O'chiriladigan foydalanuvchi ID
 *     responses:
 *       200:
 *         description: Foydalanuvchi muvaffaqiyatli o'chirildi
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
user.delete("/:id", userController.deleteUser);

module.exports = { user };