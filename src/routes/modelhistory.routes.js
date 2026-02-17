const { Router } = require("express");
const modelhistory = Router();
const modelhistoryController = require("../controllers/ModelHistory.controller");

/**
 * @swagger
 * tags:
 *   name: ModelHistory
 *   description: Tugallangan modellar tarixi boshqarish uchun API endpointlar
 */

/**
 * @swagger
 * /modelhistory:
 *   get:
 *     summary: Barcha tugallangan modellar tarixini olish
 *     tags: [ModelHistory]
 *     description: Barcha tugallangan modellar tarixi ro'yxatini olish
 *     parameters:
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
 *         description: Barcha tugallangan modellar tarixi qaytarildi
 *       500:
 *         description: Ichki server xatosi
 */
modelhistory.get("/", modelhistoryController.getModelHistories);

/**
 * @swagger
 * /modelhistory/monthly:
 *   get:
 *     summary: Oy bo'yicha tugallangan modellar
 *     tags: [ModelHistory]
 *     description: Belgilangan oy uchun tugallangan modellarni olish
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Oy (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Yil
 *     responses:
 *       200:
 *         description: Oylik tugallangan modellar qaytarildi
 *       500:
 *         description: Ichki server xatosi
 */
modelhistory.get("/monthly", modelhistoryController.getCompletedModelsByMonth);

/**
 * @swagger
 * /modelhistory/statistics:
 *   get:
 *     summary: Tugallangan modellar statistikasi
 *     tags: [ModelHistory]
 *     description: Tugallangan modellar statistikasini olish
 *     parameters:
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
 *         description: Statistika qaytarildi
 *       500:
 *         description: Server xatosi
 */
modelhistory.get("/statistics", modelhistoryController.getCompletionStatistics);

/**
 * @swagger
 * /modelhistory/recent:
 *   get:
 *     summary: Oxirgi tugallangan modellar
 *     tags: [ModelHistory]
 *     description: Oxirgi tugallangan modellarni olish
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Oxirgi tugallangan modellar qaytarildi
 *       500:
 *         description: Server xatosi
 */
modelhistory.get("/recent", modelhistoryController.getRecentCompletedModels);

/**
 * @swagger
 * /modelhistory/{id}:
 *   get:
 *     summary: ID bo'yicha tarix yozuvi olish
 *     tags: [ModelHistory]
 *     description: Tarix yozuvini ID bo'yicha qidirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tarix yozuvi ID
 *     responses:
 *       200:
 *         description: Tarix yozuvi topildi
 *       404:
 *         description: Tarix yozuvi topilmadi
 *       500:
 *         description: Server xatosi
 */
modelhistory.get("/:id", modelhistoryController.getModelHistoryById);

/**
 * @swagger
 * /modelhistory/{id}:
 *   delete:
 *     summary: Tarix yozuvini o'chirish
 *     tags: [ModelHistory]
 *     description: Tarix yozuvini ID bo'yicha o'chirish (faqat admin uchun)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: O'chiriladigan tarix yozuvi ID
 *     responses:
 *       200:
 *         description: Tarix yozuvi muvaffaqiyatli o'chirildi
 *       404:
 *         description: Tarix yozuvi topilmadi
 *       500:
 *         description: Server xatosi
 */
modelhistory.delete("/:id", modelhistoryController.deleteModelHistory);

module.exports = { modelhistory };