const { Router } = require("express");
const monthlyclosure = Router();
const monthlyclosureController = require("../controllers/MonthlyClosure.controller");

/**
 * @swagger
 * tags:
 *   name: MonthlyClosure
 *   description: Oylik yopish operatsiyalari uchun API endpointlar
 */

/**
 * @swagger
 * /monthlyclosure:
 *   post:
 *     summary: Oyni yopish
 *     tags: [MonthlyClosure]
 *     description: Belgilangan oyni yopish va foydalanuvchilar uchun summariya yaratish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *               - year
 *               - closed_by
 *             properties:
 *               month:
 *                 type: integer
 *               year:
 *                 type: integer
 *               closed_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Oy muvaffaqiyatli yopildi
 *       400:
 *         description: Validatsiya xatosi
 *       500:
 *         description: Ichki server xatosi
 */
monthlyclosure.post("/", monthlyclosureController.closeMonth);

/**
 * @swagger
 * /monthlyclosure:
 *   get:
 *     summary: Barcha yopilgan oylarni olish
 *     tags: [MonthlyClosure]
 *     description: Barcha yopilgan oylar ro'yxatini olish
 *     responses:
 *       200:
 *         description: Barcha yopilgan oylar qaytarildi
 *       500:
 *         description: Ichki server xatosi
 */
monthlyclosure.get("/", monthlyclosureController.getMonthlyClosures);

/**
 * @swagger
 * /monthlyclosure/last:
 *   get:
 *     summary: Oxirgi yopilgan oyni olish
 *     tags: [MonthlyClosure]
 *     description: Oxirgi yopilgan oyni olish
 *     responses:
 *       200:
 *         description: Oxirgi yopilgan oy qaytarildi
 *       404:
 *         description: Yopilgan oy topilmadi
 *       500:
 *         description: Server xatosi
 */
monthlyclosure.get("/last", monthlyclosureController.getLastClosedMonth);

/**
 * @swagger
 * /monthlyclosure/statistics:
 *   get:
 *     summary: Yopilgan oylar statistikasi
 *     tags: [MonthlyClosure]
 *     description: Yopilgan oylar bo'yicha statistikani olish
 *     responses:
 *       200:
 *         description: Statistika qaytarildi
 *       500:
 *         description: Server xatosi
 */
monthlyclosure.get("/statistics", monthlyclosureController.getClosureStatistics);

/**
 * @swagger
 * /monthlyclosure/{month}/{year}:
 *   get:
 *     summary: Oy va yil bo'yicha yopilgan oyni olish
 *     tags: [MonthlyClosure]
 *     description: Belgilangan oy va yil uchun yopilgan oyni olish
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
 *         description: Yopilgan oy qaytarildi
 *       404:
 *         description: Yopilgan oy topilmadi
 *       500:
 *         description: Server xatosi
 */
monthlyclosure.get("/:month/:year", monthlyclosureController.getMonthlyClosureByMonthYear);

/**
 * @swagger
 * /monthlyclosure/{id}:
 *   get:
 *     summary: ID bo'yicha yopilgan oyni olish
 *     tags: [MonthlyClosure]
 *     description: Yopilgan oyni ID bo'yicha qidirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Yopilgan oy ID
 *     responses:
 *       200:
 *         description: Yopilgan oy topildi
 *       404:
 *         description: Yopilgan oy topilmadi
 *       500:
 *         description: Server xatosi
 */
monthlyclosure.get("/:id", monthlyclosureController.getMonthlyClosureById);

/**
 * @swagger
 * /monthlyclosure/{id}:
 *   delete:
 *     summary: Yopilgan oyni o'chirish
 *     tags: [MonthlyClosure]
 *     description: Yopilgan oyni ID bo'yicha o'chirish (faqat admin uchun)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: O'chiriladigan yopilgan oy ID
 *     responses:
 *       200:
 *         description: Yopilgan oy muvaffaqiyatli o'chirildi
 *       404:
 *         description: Yopilgan oy topilmadi
 *       500:
 *         description: Server xatosi
 */
monthlyclosure.delete("/:id", monthlyclosureController.deleteMonthlyClosure);

module.exports = { monthlyclosure };