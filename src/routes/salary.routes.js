const { Router } = require("express");
const salaryrate = Router();
const salaryrateController = require("../controllers/SalaryRate.controller");

/**
 * @swagger
 * tags:
 *   name: SalaryRates
 *   description: Ish haqi stavkalari boshqarish uchun API endpointlar
 */

/**
 * @swagger
 * /salaryrates:
 *   post:
 *     summary: Yangi ish haqi stavkasi yaratish
 *     tags: [SalaryRates]
 *     description: Yangi ish haqi stavkasi ma'lumotlarini yaratish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - price_per_minute
 *             properties:
 *               price_per_minute:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Ish haqi stavkasi muvaffaqiyatli yaratildi
 *       400:
 *         description: Validatsiya xatosi
 *       500:
 *         description: Ichki server xatosi
 */
salaryrate.post("/", salaryrateController.createSalaryRate);

/**
 * @swagger
 * /salaryrates:
 *   get:
 *     summary: Barcha ish haqi stavkalarini olish
 *     tags: [SalaryRates]
 *     description: Barcha ish haqi stavkalari ro'yxatini olish
 *     responses:
 *       200:
 *         description: Barcha ish haqi stavkalari qaytarildi
 *       500:
 *         description: Ichki server xatosi
 */
salaryrate.get("/", salaryrateController.getSalaryRates);

/**
 * @swagger
 * /salaryrates/active:
 *   get:
 *     summary: Faol ish haqi stavkasini olish
 *     tags: [SalaryRates]
 *     description: Joriy faol ish haqi stavkasini olish
 *     responses:
 *       200:
 *         description: Faol ish haqi stavkasi qaytarildi
 *       404:
 *         description: Faol ish haqi stavkasi topilmadi
 *       500:
 *         description: Server xatosi
 */
salaryrate.get("/active", salaryrateController.getActiveSalaryRate);

/**
 * @swagger
 * /salaryrates/history:
 *   get:
 *     summary: Ish haqi tarixini olish
 *     tags: [SalaryRates]
 *     description: Ish haqi stavkalari tarixi va statistikasini olish
 *     responses:
 *       200:
 *         description: Ish haqi tarixi qaytarildi
 *       500:
 *         description: Server xatosi
 */
salaryrate.get("/history", salaryrateController.getSalaryRateHistory);

/**
 * @swagger
 * /salaryrates/{id}:
 *   get:
 *     summary: ID bo'yicha ish haqi stavkasi olish
 *     tags: [SalaryRates]
 *     description: Ish haqi stavkasini ID bo'yicha qidirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ish haqi stavkasi ID
 *     responses:
 *       200:
 *         description: Ish haqi stavkasi topildi
 *       404:
 *         description: Ish haqi stavkasi topilmadi
 *       500:
 *         description: Server xatosi
 */
salaryrate.get("/:id", salaryrateController.getSalaryRateById);

/**
 * @swagger
 * /salaryrates/{id}/activate:
 *   put:
 *     summary: Ish haqi stavkasini faollashtirish
 *     tags: [SalaryRates]
 *     description: Ish haqi stavkasini faol holatga o'tkazish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ish haqi stavkasi ID
 *     responses:
 *       200:
 *         description: Ish haqi stavkasi muvaffaqiyatli faollashtirildi
 *       404:
 *         description: Ish haqi stavkasi topilmadi
 *       500:
 *         description: Server xatosi
 */
salaryrate.put("/:id/activate", salaryrateController.activateSalaryRate);

/**
 * @swagger
 * /salaryrates/{id}:
 *   put:
 *     summary: Ish haqi stavkasi ma'lumotlarini yangilash
 *     tags: [SalaryRates]
 *     description: Ish haqi stavkasini ID bo'yicha yangilash
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ish haqi stavkasi ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price_per_minute: { type: number }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Ish haqi stavkasi muvaffaqiyatli yangilandi
 *       404:
 *         description: Ish haqi stavkasi topilmadi
 *       500:
 *         description: Server xatosi
 */
salaryrate.put("/:id", salaryrateController.updateSalaryRate);

/**
 * @swagger
 * /salaryrates/{id}:
 *   delete:
 *     summary: Ish haqi stavkasi o'chirish
 *     tags: [SalaryRates]
 *     description: Ish haqi stavkasini ID bo'yicha o'chirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: O'chiriladigan ish haqi stavkasi ID
 *     responses:
 *       200:
 *         description: Ish haqi stavkasi muvaffaqiyatli o'chirildi
 *       404:
 *         description: Ish haqi stavkasi topilmadi
 *       500:
 *         description: Server xatosi
 */
salaryrate.delete("/:id", salaryrateController.deleteSalaryRate);

module.exports = { salaryrate };