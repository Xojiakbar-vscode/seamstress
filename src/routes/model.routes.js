const { Router } = require("express");
const model = Router();
const modelController = require("../controllers/model.controller");

/**
 * @swagger
 * tags:
 *   name: Models
 *   description: Modellar boshqarish uchun API endpointlar
 */

/**
 * @swagger
 * /models:
 *   post:
 *     summary: Yangi model yaratish
 *     tags: [Models]
 *     description: Yangi model ma'lumotlarini yaratish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - total_quantity
 *             properties:
 *               name:
 *                 type: string
 *               total_quantity:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [active, completed]
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     detail_id: { type: integer }
 *                     required_quantity: { type: integer }
 *                     time_per_unit: { type: number }
 *     responses:
 *       201:
 *         description: Model muvaffaqiyatli yaratildi
 *       400:
 *         description: Validatsiya xatosi
 *       500:
 *         description: Ichki server xatosi
 */
model.post("/", modelController.createModel);

/**
 * @swagger
 * /models:
 *   get:
 *     summary: Barcha modellarni olish
 *     tags: [Models]
 *     description: Barcha modellar ro'yxatini olish
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed]
 *         description: Model holati bo'yicha filter
 *     responses:
 *       200:
 *         description: Barcha modellar qaytarildi
 *       500:
 *         description: Ichki server xatosi
 */
model.get("/", modelController.getModels);

/**
 * @swagger
 * /models/search:
 *   get:
 *     summary: Model qidirish
 *     tags: [Models]
 *     description: Nomi yoki holati bo'yicha qidirish
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
model.get("/search", modelController.searchModels);

/**
 * @swagger
 * /models/{id}:
 *   get:
 *     summary: ID bo'yicha model olish
 *     tags: [Models]
 *     description: Modelni ID bo'yicha qidirish (batafsil ma'lumot bilan)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Model ID
 *     responses:
 *       200:
 *         description: Model topildi
 *       404:
 *         description: Model topilmadi
 *       500:
 *         description: Server xatosi
 */
model.get("/:id", modelController.getModelById);

/**
 * @swagger
 * /models/{id}/progress:
 *   get:
 *     summary: Modelning bajarilish foizini olish
 *     tags: [Models]
 *     description: Modelning detallari bo'yicha bajarilish progressini olish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Model ID
 *     responses:
 *       200:
 *         description: Progress ma'lumotlari qaytarildi
 *       404:
 *         description: Model topilmadi
 *       500:
 *         description: Server xatosi
 */
model.get("/:id/progress", modelController.getModelProgress);

/**
 * @swagger
 * /models/{id}/details:
 *   post:
 *     summary: Modelga detal qo'shish
 *     tags: [Models]
 *     description: Mavjud modelga yangi detal qo'shish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Model ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - detail_id
 *               - required_quantity
 *               - time_per_unit
 *             properties:
 *               detail_id: { type: integer }
 *               required_quantity: { type: integer }
 *               time_per_unit: { type: number }
 *     responses:
 *       201:
 *         description: Detal modelga muvaffaqiyatli qo'shildi
 *       404:
 *         description: Model yoki detal topilmadi
 *       500:
 *         description: Server xatosi
 */
model.post("/:id/details", modelController.addDetailToModel);

/**
 * @swagger
 * /models/{id}/complete:
 *   post:
 *     summary: Modelni tugatish
 *     tags: [Models]
 *     description: Modelni completed holatiga o'tkazish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Model ID
 *     responses:
 *       200:
 *         description: Model muvaffaqiyatli tugatildi
 *       404:
 *         description: Model topilmadi
 *       500:
 *         description: Server xatosi
 */
model.post("/:id/complete", modelController.completeModel);

/**
 * @swagger
 * /models/{id}:
 *   put:
 *     summary: Model ma'lumotlarini yangilash
 *     tags: [Models]
 *     description: Modelni ID bo'yicha yangilash
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Model ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               total_quantity: { type: integer }
 *               status: { type: string, enum: [active, completed] }
 *     responses:
 *       200:
 *         description: Model muvaffaqiyatli yangilandi
 *       404:
 *         description: Model topilmadi
 *       500:
 *         description: Server xatosi
 */
model.put("/:id", modelController.updateModel);

/**
 * @swagger
 * /models/{id}:
 *   delete:
 *     summary: Model o'chirish
 *     tags: [Models]
 *     description: Modelni ID bo'yicha o'chirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: O'chiriladigan model ID
 *     responses:
 *       200:
 *         description: Model muvaffaqiyatli o'chirildi
 *       404:
 *         description: Model topilmadi
 *       500:
 *         description: Server xatosi
 */
model.delete("/:id", modelController.deleteModel);

module.exports = { model };