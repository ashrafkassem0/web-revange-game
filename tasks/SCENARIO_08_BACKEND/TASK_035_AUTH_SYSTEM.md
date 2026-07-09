# TASK_035 — AUTH_SYSTEM

## Objective
Implement Register, Login, Token Refresh, and Logout endpoints with bcrypt password hashing and JWT tokens.

## API Endpoints

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/v1/auth/register` | No | `{ username, email, password }` | `{ user: { id, username }, token }` |
| POST | `/api/v1/auth/login` | No | `{ email, password }` | `{ user: { id, username }, token }` |
| POST | `/api/v1/auth/refresh` | Yes | — | `{ token }` |
| POST | `/api/v1/auth/logout` | Yes | — | `{ message: "logged out" }` |
| GET | `/api/v1/auth/me` | Yes | — | `{ user: { id, username, email, createdAt } }` |

## Validation (Zod)

### Registration
```javascript
const registerSchema = z.object({
  username: z.string().min(3).max(20)
    .regex(/^[\w\u0600-\u06FF]+$/, 'اسم المستخدم يحتوي على أحرف غير مسموحة'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور أقصر من 8 أحرف')
    .regex(/[a-zA-Z]/, 'يجب أن تحتوي كلمة المرور على حرف')
    .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم')
});
```

### Error Codes
| Status | Condition | Arabic Message |
|--------|-----------|----------------|
| 400 | Validation failure | Errors per field |
| 401 | Invalid credentials | "البريد الإلكتروني أو كلمة المرور غير صحيحة" |
| 409 | Duplicate email | "البريد الإلكتروني مستخدم بالفعل" |
| 409 | Duplicate username | "اسم المستخدم مستخدم بالفعل" |
| 429 | Rate limited | "طلبات كثيرة جداً، حاول لاحقاً" |
| 423 | Account locked | "الحساب مقفل، حاول بعد 15 دقيقة" |

## Rate Limiting
- Login: 5 attempts per IP per minute → 429 for 60s
- Register: 3 per IP per minute
- After 10 failed login attempts → lock account for 15 min

## JWT
```javascript
// Token payload
{ sub: userId, username: 'player', iat: timestamp, exp: timestamp + 7d }

// Verify middleware
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'غير مصرح به' });
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'انتهت صلاحية الجلسة' }); }
}
```

## Verification & Acceptance Criteria
- [ ] Register with valid data returns user + token
- [ ] Register with duplicate email returns 409 with Arabic message
- [ ] Register with weak password returns 400 with validation errors
- [ ] Login with correct credentials returns token
- [ ] Login with wrong password returns 401
- [ ] Token decodes correctly via `jwt.verify`
- [ ] `/me` returns user profile with valid token
- [ ] `/me` returns 401 when token missing/expired
- [ ] Rate limiting blocks rapid login attempts
- [ ] Account locks after 10 failures for 15 minutes
