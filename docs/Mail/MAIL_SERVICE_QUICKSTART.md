# 📧 Mail Service Quick Start

## 🚀 Quick Start

### 1. Pastikan Redis Running

```bash
# Start Redis via Docker Compose
npm run dev:services

# Verify Redis is running
docker ps | grep keramik-redis
```

### 2. Update Environment Variables

File `.env` sudah configured dengan benar untuk Redis:

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 3. Gunakan Mail Service

```typescript
import { MailService } from '@modules/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(private readonly mailService: MailService) {}

  async register(email: string, name: string) {
    // Generate token
    const token = 'verification-token-here';
    
    // Queue verification email
    await this.mailService.sendVerificationEmail({
      to: email,
      name: name,
      token: token,
    });
    
    // Email akan diproses secara asynchronous
    // User tidak perlu menunggu email terkirim
  }
}
```

## 📊 Monitor Queue

```typescript
// Get queue statistics
const stats = await this.mailService.getQueueStats();
console.log(stats);
// {
//   waiting: 5,
//   active: 2,
//   completed: 1000,
//   failed: 3,
//   delayed: 0,
//   total: 1010
// }
```

## 🎯 Available Methods

```typescript
// 1. Verification Email
await mailService.sendVerificationEmail({
  to: 'user@example.com',
  name: 'John Doe',
  token: 'verification-token',
});

// 2. Reset Password Email
await mailService.sendResetPasswordEmail({
  to: 'user@example.com',
  name: 'John Doe',
  token: 'reset-token',
});

// 3. Password Changed Email
await mailService.sendPasswordChangedEmail({
  to: 'user@example.com',
  name: 'John Doe',
  changedAt: new Date(),
  ipAddress: '192.168.1.1',
});

// 4. Welcome Email
await mailService.sendWelcomeEmail({
  to: 'user@example.com',
  name: 'John Doe',
});

// 5. New Login Notification
await mailService.sendNewLoginNotification({
  to: 'user@example.com',
  name: 'John Doe',
  loginAt: new Date(),
  ipAddress: '192.168.1.1',
  location: 'Jakarta, Indonesia',
  device: 'Chrome on Windows',
});

// 6. Suspicious Activity Alert
await mailService.sendSuspiciousActivityAlert({
  to: 'user@example.com',
  name: 'John Doe',
  activityType: 'Multiple failed login attempts',
  detectedAt: new Date(),
  ipAddress: '192.168.1.1',
  location: 'Unknown Location',
});
```

## 📖 Full Documentation

Lihat [MAIL_SERVICE_GUIDE.md](./MAIL_SERVICE_GUIDE.md) untuk dokumentasi lengkap.

---

**Last Updated:** January 9, 2026
