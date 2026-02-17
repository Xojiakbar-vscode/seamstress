const { Router } = require("express");
const usermonthlysummary = Router();
const usermonthlysummaryController = require("../controllers/UserMonthlySummary.controller");

/**
 * @swagger
 * tags:
 *   name: UserMonthlySummary
 *   description: Foydalanuvchi oylik summariyasi boshqarish uchun API endpointlar
 */

/**
 * @swagger
 * /usermonthlysummary:
 *   get:
 *     summary: Barcha foydalanuvchi oylik summariyalarini olish
 *     tags: [UserMonthlySummary]
 *     description: Barcha foydalanuvchi oylik summariyalari ro'yxatini olish
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID bo'yicha filter
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Oy bo'yicha filter (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Yil bo'yicha filter
 *       - in: query
 *         name: start_month
 *         schema:
 *           type: integer
 *         description: Boshlang'ich oy
 *       - in: query
 *         name: start_year
 *         schema:
 *           type: integer
 *         description: Boshlang'ich yil
 *       - in: query
 *         name: end_month
 *         schema:
 *           type: integer
 *         description: Tugash oy
 *       - in: query
 *         name: end_year
 *         schema:
 *           type: integer
 *         description: Tugash yil
 *     responses:
 *       200:
 *         description: Barcha oylik summariyalar qaytarildi
 *       500:
 *         description: Ichki server xatosi
 */
usermonthlysummary.get("/", usermonthlysummaryController.getUserMonthlySummaries);

/**
 * @swagger
 * /usermonthlysummary/users/{userId}:
 *   get:
 *     summary: Foydalanuvchi bo'yicha oylik summariyalar
 *     tags: [UserMonthlySummary]
 *     description: Belgilangan foydalanuvchi uchun barcha oylik summariyalarni olish
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID
 *     responses:
 *       200:
 *         description: Foydalanuvchi oylik summariyalari qaytarildi
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
usermonthlysummary.get("/users/:userId", usermonthlysummaryController.getUserSummariesByUserId);

/**
 * @swagger
 * /usermonthlysummary/users/{userId}/last:
 *   get:
 *     summary: Foydalanuvchi uchun oxirgi oylik summariya
 *     tags: [UserMonthlySummary]
 *     description: Belgilangan foydalanuvchi uchun oxirgi oylik summariyani olish
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID
 *     responses:
 *       200:
 *         description: Oxirgi oylik summariya qaytarildi
 *       404:
 *         description: Foydalanuvchi yoki summariya topilmadi
 *       500:
 *         description: Server xatosi
 */
usermonthlysummary.get("/users/:userId/last", usermonthlysummaryController.getUserLastMonthlySummary);

/**
 * @swagger
 * /usermonthlysummary/month/{month}/{year}:
 *   get:
 *     summary: Oy bo'yicha barcha foydalanuvchilar summariyasi
 *     tags: [UserMonthlySummary]
 *     description: Belgilangan oy uchun barcha foydalanuvchilar summariyasini olish
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
 *         description: Oylik summariya qaytarildi
 *       500:
 *         description: Server xatosi
 */
usermonthlysummary.get("/month/:month/:year", usermonthlysummaryController.getMonthlySummaryByMonth);

/**
 * @swagger
 * /usermonthlysummary/top-earners:
 *   get:
 *     summary: Eng ko'p daromad olgan foydalanuvchilar
 *     tags: [UserMonthlySummary]
 *     description: Eng ko'p daromad olgan foydalanuvchilarni olish
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Oy bo'yicha filter
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Yil bo'yicha filter
 *     responses:
 *       200:
 *         description: Eng ko'p daromad olgan foydalanuvchilar qaytarildi
 *       500:
 *         description: Server xatosi
 */
usermonthlysummary.get("/top-earners", usermonthlysummaryController.getTopEarners);

/**
 * @swagger
 * /usermonthlysummary/year/{year}:
 *   get:
 *     summary: Yillik summariya
 *     tags: [UserMonthlySummary]
 *     description: Belgilangan yil uchun barcha foydalanuvchilar yillik summariyasini olish
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Yil
 *     responses:
 *       200:
 *         description: Yillik summariya qaytarildi
 *       500:
 *         description: Server xatosi
 */
usermonthlysummary.get("/year/:year", usermonthlysummaryController.getYearlySummary);

/**
 * @swagger
 * /usermonthlysummary/{id}:
 *   get:
 *     summary: ID bo'yicha oylik summariya olish
 *     tags: [UserMonthlySummary]
 *     description: Oylik summariyani ID bo'yicha qidirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Oylik summariya ID
 *     responses:
 *       200:
 *         description: Oylik summariya topildi
 *       404:
 *         description: Oylik summariya topilmadi
 *       500:
 *         description: Server xatosi
 */
usermonthlysummary.get("/:id", usermonthlysummaryController.getUserMonthlySummaryById);

module.exports = { usermonthlysummary };