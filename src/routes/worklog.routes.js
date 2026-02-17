const { Router } = require("express");
const worklog = Router();
const worklogController = require("../controllers/work.controller");

/**
 * @swagger
 * tags:
 *   name: WorkLogs
 *   description: Ish yozuvlari boshqarish uchun API endpointlar
 */

/**
 * @swagger
 * /worklogs:
 *   post:
 *     summary: Yangi ish yozuvi yaratish
 *     tags: [WorkLogs]
 *     description: Yangi ish yozuvi ma'lumotlarini yaratish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - model_id
 *               - detail_id
 *               - quantity
 *             properties:
 *               user_id:
 *                 type: integer
 *               model_id:
 *                 type: integer
 *               detail_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               work_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Ish yozuvi muvaffaqiyatli yaratildi
 *       400:
 *         description: Validatsiya xatosi
 *       500:
 *         description: Ichki server xatosi
 */
worklog.post("/", worklogController.createWorkLog);

/**
 * @swagger
 * /worklogs:
 *   get:
 *     summary: Barcha ish yozuvlarini olish
 *     tags: [WorkLogs]
 *     description: Barcha ish yozuvlari ro'yxatini olish
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID bo'yicha filter
 *       - in: query
 *         name: model_id
 *         schema:
 *           type: integer
 *         description: Model ID bo'yicha filter
 *       - in: query
 *         name: detail_id
 *         schema:
 *           type: integer
 *         description: Detal ID bo'yicha filter
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
 *         description: Barcha ish yozuvlari qaytarildi
 *       500:
 *         description: Ichki server xatosi
 */
worklog.get("/", worklogController.getWorkLogs);

/**
 * @swagger
 * /worklogs/daily:
 *   get:
 *     summary: Kunlik ish yozuvlarini olish
 *     tags: [WorkLogs]
 *     description: Belgilangan kun uchun ish yozuvlarini olish
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Kunlik ish yozuvlari qaytarildi
 *       500:
 *         description: Ichki server xatosi
 */
worklog.get("/daily", worklogController.getDailyWorkLogs);

/**
 * @swagger
 * /worklogs/monthly-statistics:
 *   get:
 *     summary: Oylik statistikalar
 *     tags: [WorkLogs]
 *     description: Belgilangan oy uchun statistikalarni olish
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Oy (1-12). Agar berilmasa joriy oy ishlatiladi.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Yil. Agar berilmasa joriy yil ishlatiladi.
 *     responses:
 *       200:
 *         description: Oylik statistikalar qaytarildi
 *       500:
 *         description: Ichki server xatosi
 */
worklog.get("/monthly-statistics", worklogController.getMonthlyStatistics);

/**
 * @swagger
 * /worklogs/archive-all:
 *   post:
 *     summary: Barcha ish yozuvlarini arxivlash
 *     tags: [WorkLogs]
 *     description: Barcha mavjud ish yozuvlarini WorkLogHistory jadvaliga ko'chirib, asosiy jadvalni tozalaydi
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Arxivlash sababi (ixtiyoriy)
 *                 example: "Oy yakuni bo'yicha tozalash"
 *     responses:
 *       200:
 *         description: Barcha yozuvlar muvaffaqiyatli arxivlandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Barcha ish yozuvlari tarixga ko'chirildi va muvaffaqiyatli o'chirildi"
 *                 archivedCount:
 *                   type: integer
 *                   example: 150
 *       400:
 *         description: Arxivlash uchun ma'lumot topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "O'chirish uchun ma'lumot topilmadi"
 *       500:
 *         description: Ichki server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Xatolik yuz berdi"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */
// Routerga qo'shish
worklog.post("/archive-all", worklogController.archiveAllWorkLogs);

/**
 * @swagger
 * /worklogs/archive:
 *   get:
 *     summary: Arxivlangan barcha ish yozuvlarini olish
 *     tags: [WorkLogs]
 *     description: Filtrlar bo'yicha arxivlangan ish yozuvlarini qaytaradi
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID si bo'yicha filtrlash
 *         example: 5
 *       - in: query
 *         name: model_id
 *         schema:
 *           type: integer
 *         description: Model ID si bo'yicha filtrlash
 *         example: 3
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Boshlanish sanasi (YYYY-MM-DD formatida)
 *         example: "2024-01-01"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Tugash sanasi (YYYY-MM-DD formatida)
 *         example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Arxivlangan yozuvlar muvaffaqiyatli qaytarildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       original_worklog_id:
 *                         type: integer
 *                         example: 100
 *                       user_id:
 *                         type: integer
 *                         example: 5
 *                       model_id:
 *                         type: integer
 *                         example: 3
 *                       detail_id:
 *                         type: integer
 *                         example: 7
 *                       quantity:
 *                         type: integer
 *                         example: 50
 *                       total_price:
 *                         type: number
 *                         format: float
 *                         example: 250000.00
 *                       work_date:
 *                         type: string
 *                         format: date
 *                         example: "2024-05-15"
 *                       reason:
 *                         type: string
 *                         example: "Oy yakuni bo'yicha tozalash"
 *                       archived_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-05-31T10:30:00.000Z"
 *                       User:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 5
 *                           first_name:
 *                             type: string
 *                             example: "John"
 *                           last_name:
 *                             type: string
 *                             example: "Doe"
 *                       Model:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 3
 *                           name:
 *                             type: string
 *                             example: "Model X"
 *                       Detail:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 7
 *                           name:
 *                             type: string
 *                             example: "Detail Y"
 *       500:
 *         description: Arxivni yuklashda xatolik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Arxivni yuklashda xatolik"
 *                 error:
 *                   type: string
 *                   example: "Invalid date format"
 */
worklog.get("/archive", worklogController.getArchivedWorkLogs);

/**
 * @swagger
 * /worklogs/archive/user/{userId}:
 *   get:
 *     summary: Muayyan foydalanuvchining arxivlangan ish yozuvlarini olish
 *     tags: [WorkLogs]
 *     description: Foydalanuvchi ID si bo'yicha uning arxivlangan ish yozuvlarini qaytaradi
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID si
 *         example: 5
 *     responses:
 *       200:
 *         description: Foydalanuvchining arxivlangan yozuvlari
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   original_worklog_id:
 *                     type: integer
 *                     example: 100
 *                   user_id:
 *                     type: integer
 *                     example: 5
 *                   model_id:
 *                     type: integer
 *                     example: 3
 *                   detail_id:
 *                     type: integer
 *                     example: 7
 *                   quantity:
 *                     type: integer
 *                     example: 50
 *                   total_price:
 *                     type: number
 *                     format: float
 *                     example: 250000.00
 *                   work_date:
 *                     type: string
 *                     format: date
 *                     example: "2024-05-15"
 *                   reason:
 *                     type: string
 *                     example: "Oy yakuni bo'yicha tozalash"
 *                   archived_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-05-31T10:30:00.000Z"
 *                   Model:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Model X"
 *                   Detail:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Detail Y"
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Database connection error"
 */
worklog.get("/archive/user/:userId", worklogController.getArchivedWorkLogs);

/**
 * @swagger
 * /worklogs/users/{userId}/daily:
 *   get:
 *     summary: Foydalanuvchi bo'yicha kunlik ish yozuvlari
 *     tags: [WorkLogs]
 *     description: Belgilangan foydalanuvchi uchun kunlik ish yozuvlarini olish
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Foydalanuvchi kunlik ish yozuvlari qaytarildi
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
worklog.get("/users/:userId/daily", worklogController.getUserDailyWorkLogs);

worklog.delete("/archive/:id", worklogController.deleteArchivedWorkLog);

/**
 * @swagger
 * /worklogs/{id}:
 *   get:
 *     summary: ID bo'yicha ish yozuvi olish
 *     tags: [WorkLogs]
 *     description: Ish yozuvini ID bo'yicha qidirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ish yozuvi ID
 *     responses:
 *       200:
 *         description: Ish yozuvi topildi
 *       404:
 *         description: Ish yozuvi topilmadi
 *       500:
 *         description: Server xatosi
 */
worklog.get("/:id", worklogController.getWorkLogById);

/**
 * @swagger
 * /worklogs/{id}:
 *   put:
 *     summary: Ish yozuvi ma'lumotlarini yangilash
 *     tags: [WorkLogs]
 *     description: Ish yozuvini ID bo'yicha yangilash (faqat quantity va work_date)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ish yozuvi ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity: { type: integer }
 *               work_date: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Ish yozuvi muvaffaqiyatli yangilandi
 *       404:
 *         description: Ish yozuvi topilmadi
 *       500:
 *         description: Server xatosi
 */
worklog.put("/:id", worklogController.updateWorkLog);

/**
 * @swagger
 * /worklogs/{id}:
 *   delete:
 *     summary: Ish yozuvi o'chirish
 *     tags: [WorkLogs]
 *     description: Ish yozuvini ID bo'yicha o'chirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: O'chiriladigan ish yozuvi ID
 *     responses:
 *       200:
 *         description: Ish yozuvi muvaffaqiyatli o'chirildi
 *       404:
 *         description: Ish yozuvi topilmadi
 *       500:
 *         description: Server xatosi
 */
worklog.delete("/:id", worklogController.deleteWorkLog);

module.exports = { worklog };