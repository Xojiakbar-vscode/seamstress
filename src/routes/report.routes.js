const { Router } = require("express");
const report = Router();
const reportController = require("../controllers/report.controller");

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Hisobotlar generatori uchun API endpointlar
 */

/**
 * @swagger
 * /reports/monthly/{month}/{year}:
 *   get:
 *     summary: Oylik hisobot yaratish
 *     tags: [Reports]
 *     description: Belgilangan oy uchun Excel formatida oylik hisobot yaratish
 *     parameters:
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Oy (1-12)
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Yil
 *     responses:
 *       200:
 *         description: Excel fayl qaytarildi
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Oy yopilmagan
 *       500:
 *         description: Server xatosi
 */
report.get("/monthly/:month/:year", reportController.generateMonthlyReport);

/**
 * @swagger
 * /reports/users/{userId}:
 *   get:
 *     summary: Foydalanuvchi hisoboti yaratish
 *     tags: [Reports]
 *     description: Belgilangan foydalanuvchi uchun Excel formatida hisobot yaratish
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Boshlang'ich sana
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Tugash sanasi
 *     responses:
 *       200:
 *         description: Excel fayl qaytarildi
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
report.get("/users/:userId", reportController.generateUserReport);

/**
 * @swagger
 * /reports/models/{id}:
 *   get:
 *     summary: Model hisoboti yaratish
 *     tags: [Reports]
 *     description: Belgilangan model uchun Excel formatida hisobot yaratish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Model ID
 *     responses:
 *       200:
 *         description: Excel fayl qaytarildi
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Model topilmadi
 *       500:
 *         description: Server xatosi
 */
report.get("/models/:id", reportController.generateModelReport);

module.exports = { report };