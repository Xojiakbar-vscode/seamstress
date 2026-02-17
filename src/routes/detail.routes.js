const { Router } = require("express");
const detail = Router();
const detailController = require("../controllers/detail.controller");

/**
 * @swagger
 * tags:
 *   name: Details
 *   description: Detallar boshqarish uchun API endpointlar
 */

/**
 * @swagger
 * /details:
 *   post:
 *     summary: Yangi detal yaratish
 *     tags: [Details]
 *     description: Yangi detal ma'lumotlarini yaratish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Detal muvaffaqiyatli yaratildi
 *       400:
 *         description: Validatsiya xatosi
 *       500:
 *         description: Ichki server xatosi
 */
detail.post("/", detailController.createDetail);

/**
 * @swagger
 * /details:
 *   get:
 *     summary: Barcha detallarni olish
 *     tags: [Details]
 *     description: Barcha detallar ro'yxatini olish
 *     responses:
 *       200:
 *         description: Barcha detallar qaytarildi
 *       500:
 *         description: Ichki server xatosi
 */
detail.get("/", detailController.getDetails);

/**
 * @swagger
 * /details/search:
 *   get:
 *     summary: Detal qidirish
 *     tags: [Details]
 *     description: Nomi bo'yicha qidirish
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
detail.get("/search", detailController.searchDetails);

/**
 * @swagger
 * /details/{id}:
 *   get:
 *     summary: ID bo'yicha detal olish
 *     tags: [Details]
 *     description: Detalni ID bo'yicha qidirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Detal ID
 *     responses:
 *       200:
 *         description: Detal topildi
 *       404:
 *         description: Detal topilmadi
 *       500:
 *         description: Server xatosi
 */
detail.get("/:id", detailController.getDetailById);

/**
 * @swagger
 * /details/{id}/statistics:
 *   get:
 *     summary: Detal statistikasini olish
 *     tags: [Details]
 *     description: Detalning ishlatilishi va statistikasini olish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Detal ID
 *     responses:
 *       200:
 *         description: Statistika qaytarildi
 *       404:
 *         description: Detal topilmadi
 *       500:
 *         description: Server xatosi
 */
detail.get("/:id/statistics", detailController.getDetailStatistics);

/**
 * @swagger
 * /details/{id}:
 *   put:
 *     summary: Detal ma'lumotlarini yangilash
 *     tags: [Details]
 *     description: Detalni ID bo'yicha yangilash
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Detal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200:
 *         description: Detal muvaffaqiyatli yangilandi
 *       404:
 *         description: Detal topilmadi
 *       500:
 *         description: Server xatosi
 */
detail.put("/:id", detailController.updateDetail);

/**
 * @swagger
 * /details/{id}:
 *   delete:
 *     summary: Detal o'chirish
 *     tags: [Details]
 *     description: Detalni ID bo'yicha o'chirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: O'chiriladigan detal ID
 *     responses:
 *       200:
 *         description: Detal muvaffaqiyatli o'chirildi
 *       404:
 *         description: Detal topilmadi
 *       500:
 *         description: Server xatosi
 */
detail.delete("/:id", detailController.deleteDetail);

module.exports = { detail };