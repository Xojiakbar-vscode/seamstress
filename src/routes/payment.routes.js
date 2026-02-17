const { Router } = require("express");
const payment = Router();
const paymentController = require("../controllers/peyment.controller");

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: To'lovlar boshqaruvi uchun API endpointlar
 */


/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Yangi to'lov yaratish
 *     tags: [Payments]
 *     description: Foydalanuvchiga oylik yoki avans to'lov kiritish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - paid_amount
 *               - payment_type
 *             properties:
 *               user_id:
 *                 type: integer
 *               paid_amount:
 *                 type: number
 *               payment_type:
 *                 type: string
 *                 enum: [monthly, advance]
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment muvaffaqiyatli yaratildi
 *       400:
 *         description: Validatsiya xatosi
 *       500:
 *         description: Server xatosi
 */
payment.post("/", paymentController.createPayment);

/**
 * @swagger
 * /payments/history:
 *   get:
 *     summary: Payment tarixini olish
 *     tags: [Payments]
 *     description: Arxivlangan to'lovlarni ko'rish
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment tarix ma'lumotlari
 *       500:
 *         description: Server xatosi
 */
payment.get("/history", paymentController.getPaymentHistory);


/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Barcha to'lovlarni olish
 *     tags: [Payments]
 *     description: To'lovlarni user, oy yoki yil bo'yicha filterlash
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID
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
 *         description: To'lovlar ro'yxati qaytarildi
 *       500:
 *         description: Server xatosi
 */
payment.get("/", paymentController.getPayments);


/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: ID bo'yicha to'lovni olish
 *     tags: [Payments]
 *     description: Bitta to'lov ma'lumotini olish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment topildi
 *       404:
 *         description: Payment topilmadi
 *       500:
 *         description: Server xatosi
 */
payment.get("/:id", paymentController.getPaymentById);


/**
 * @swagger
 * /payments/status/{userId}:
 *   get:
 *     summary: Foydalanuvchining real vaqt to'lov holati
 *     tags: [Payments]
 *     description: User qancha topgan, qancha olgan va qancha qolganini ko'rsatadi
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID
 *     responses:
 *       200:
 *         description: To'lov holati qaytarildi
 *       500:
 *         description: Server xatosi
 */
payment.get("/status/:userId", paymentController.getUserPaymentStatus);


/**
 * @swagger
 * /payments/archive:
 *   post:
 *     summary: Oylik to'lovlarni tarixga o'tkazish
 *     tags: [Payments]
 *     description: Belgilangan oy va yil bo'yicha barcha paymentlarni PaymentHistory ga ko'chiradi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *               - year
 *             properties:
 *               month:
 *                 type: integer
 *               year:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Paymentlar tarixga o'tkazildi
 *       400:
 *         description: Ma'lumot topilmadi
 *       500:
 *         description: Server xatosi
 */
payment.post("/archive", paymentController.archiveMonthlyPayments);





/**
 * @swagger
 * /payments/history/{id}:
 *   get:
 *     summary: Payment tarixini ID bo'yicha olish
 *     tags: [Payments]
 *     description: Bitta arxivlangan paymentni olish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: PaymentHistory ID
 *     responses:
 *       200:
 *         description: Tarix topildi
 *       404:
 *         description: Topilmadi
 *       500:
 *         description: Server xatosi
 */
payment.get("/history/:id", paymentController.getPaymentHistoryById);

payment.delete("/history/:id", paymentController.deletePaymentHistoryById);
payment.delete("/history", paymentController.deleteAllPaymentHistory);


module.exports = { payment };


