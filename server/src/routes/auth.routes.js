const { Router } = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const { authRateLimit, registerRateLimit } = require('../middleware/rateLimit');
const AuthController = require('../controllers/auth.controller');

const router = Router();

// Validation schemas
const registerSchema = z.object({
  username: z
    .string().min(3, 'اسم المستخدم قصير جداً (3 أحرف على الأقل)')
    .max(20, 'اسم المستخدم طويل جداً (20 حرفاً كحد أقصى)')
    .regex(/^[\w\u0600-\u06FF]+$/, 'اسم المستخدم يحتوي على أحرف غير مسموحة'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z
    .string().min(8, 'كلمة المرور أقصر من 8 أحرف')
    .regex(/[a-zA-Z]/, 'يجب أن تحتوي كلمة المرور على حرف')
    .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم'),
});

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

// Routes
router.post('/register', registerRateLimit, validate(registerSchema), AuthController.register);
router.post('/login', authRateLimit, validate(loginSchema), AuthController.login);
router.post('/refresh', authMiddleware, AuthController.refresh);
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/me', authMiddleware, AuthController.me);

module.exports = router;
