const { Router } = require("express");
const dashboard = Router();
const dashboardController = require("../controllers/Dashboard.controller");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistikalari uchun API endpointlar
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Dashboard statistikalarini olish
 *     tags: [Dashboard]
 *     description: Barcha asosiy statistikalarni olish
 *     responses:
 *       200:
 *         description: Dashboard statistikalari qaytarildi
 *       500:
 *         description: Ichki server xatosi
 */
dashboard.get("/stats", dashboardController.getDashboardStats);

/**
 * @swagger
 * /dashboard/users/{id}/statistics:
 *   get:
 *     summary: Foydalanuvchi statistikasini olish
 *     tags: [Dashboard]
 *     description: Belgilangan foydalanuvchi uchun batafsil statistikani olish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID
 *     responses:
 *       200:
 *         description: Foydalanuvchi statistikasi qaytarildi
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
dashboard.get("/users/:id/statistics", dashboardController.getUserStatistics);

/**
 * @swagger
 * /dashboard/models/{id}/statistics:
 *   get:
 *     summary: Model statistikasini olish
 *     tags: [Dashboard]
 *     description: Belgilangan model uchun batafsil statistikani olish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Model ID
 *     responses:
 *       200:
 *         description: Model statistikasi qaytarildi
 *       404:
 *         description: Model topilmadi
 *       500:
 *         description: Server xatosi
 */
dashboard.get("/models/:id/statistics", dashboardController.getModelStatistics);

module.exports = { dashboard };