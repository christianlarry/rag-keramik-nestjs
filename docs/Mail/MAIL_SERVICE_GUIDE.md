# 📧 Mail Service dengan BullMQ

Mail service yang menggunakan BullMQ untuk asynchronous email processing dengan proper error handling, retry mechanism, dan monitoring.

## 🏗️ Arsitektur

```
┌─────────────┐      ┌────────────┐      ┌──────────────┐      ┌─────────────┐
│   Client    │─────>│ MailService│─────>│  Mail Queue  │─────>│ MailProcessor│
│  (Auth API) │      │  (Producer)│      │   (BullMQ)   │      │  (Consumer) │
└─────────────┘      └────────────┘      └──────────────┘      └──────┬──────┘
                                                                         │
                                                                         ▼
                                                                  ┌──────────────┐
                                                                  │ MailerService│
                                                                  │  (Nodemailer)│
                                                                  └──────────────┘
```

## 📂 Struktur File

```
src/modules/mail/
├── constants/
│   └── mail-queue.constants.ts    # Queue configuration constants
├── enums/
│   └── mail-job.enum.ts           # Job types dan priority enums
├── interfaces/
│   ├── mail-data.interface.ts     # Legacy interface
│   ├── mail-job-interface.ts      # Legacy interface
│   └── mail-job-data.interface.ts # Job data interfaces
├── templates/
│   ├── verification-email.hbs     # Email verification template
│   ├── reset-password.hbs         # Password reset template
│   ├── password-changed.hbs       # Password changed confirmation
│   ├── welcome.hbs                # Welcome email template
│   ├── new-login-notification.hbs # New login alert
│   └── suspicious-activity.hbs    # Security alert template
├── mail.module.ts                 # Module configuration
├── mail.service.ts                # Producer service (add jobs to queue)
└── mail.processor.ts              # Consumer processor (process jobs)
```

## 🚀 Fitur

### ✅ Job Types

1. **VERIFICATION_EMAIL** - Email verifikasi setelah registrasi
2. **RESET_PASSWORD** - Email untuk reset password
3. **PASSWORD_CHANGED** - Konfirmasi perubahan password
4. **WELCOME** - Email welcome setelah verifikasi
5. **NEW_LOGIN_NOTIFICATION** - Notifikasi login dari device baru
6. **SUSPICIOUS_ACTIVITY** - Alert untuk aktivitas mencurigakan

### ✅ Priority Levels

- **CRITICAL (4)** - Security alerts
- **HIGH (3)** - Verification, reset password
- **NORMAL (2)** - Welcome, notifications
- **LOW (1)** - Marketing emails (future)

### ✅ Error Handling

- **Automatic Retry**: 3 attempts dengan exponential backoff
- **Backoff Delay**: Mulai dari 5 detik, meningkat exponentially
- **Failed Job Storage**: Failed jobs disimpan selama 7 hari
- **Completed Job Cleanup**: Completed jobs disimpan 24 jam

### ✅ Rate Limiting

- **Queue Level**: Max 10 jobs per second
- **Concurrency**: Process 5 jobs secara concurrent

## 📝 Usage

### 1. Verification Email

```typescript
import { MailService } from '@modules/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(private readonly mailService: MailService) {}

  async register(email: string, name: string) {
    // ... create user logic ...
    
    const token = await this.generateVerificationToken(user.id);
    
    await this.mailService.sendVerificationEmail({
      to: email,
      name: name,
      token: token,
      // verificationUrl akan di-generate otomatis
      // atau bisa di-specify manual:
      // verificationUrl: `https://frontend.com/verify?token=${token}`
    });
  }
}
```

### 2. Reset Password Email

```typescript
async forgotPassword(email: string) {
  const user = await this.findByEmail(email);
  const token = await this.generateResetToken(user.id);
  
  await this.mailService.sendResetPasswordEmail({
    to: email,
    name: user.name,
    token: token,
    expiresIn: '1 hour', // Optional, default: '1 hour'
  });
}
```

### 3. Password Changed Email

```typescript
async changePassword(userId: string, request: Request) {
  // ... change password logic ...
  
  await this.mailService.sendPasswordChangedEmail({
    to: user.email,
    name: user.name,
    changedAt: new Date(),
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  });
}
```

### 4. Welcome Email

```typescript
async verifyEmail(token: string) {
  const user = await this.verifyEmailToken(token);
  
  // Update user as verified
  await this.updateUser(user.id, { emailVerified: true });
  
  // Send welcome email
  await this.mailService.sendWelcomeEmail({
    to: user.email,
    name: user.name,
  });
}
```

### 5. New Login Notification

```typescript
async login(email: string, request: Request) {
  // ... login logic ...
  
  // Check if login from new device/location
  if (this.isNewDevice(user.id, request)) {
    await this.mailService.sendNewLoginNotification({
      to: user.email,
      name: user.name,
      loginAt: new Date(),
      ipAddress: request.ip,
      location: await this.getLocationFromIP(request.ip),
      device: request.headers['user-agent'],
    });
  }
}
```

### 6. Suspicious Activity Alert

```typescript
async detectSuspiciousActivity(userId: string, activityType: string) {
  const user = await this.findById(userId);
  
  await this.mailService.sendSuspiciousActivityAlert({
    to: user.email,
    name: user.name,
    activityType: activityType,
    detectedAt: new Date(),
    ipAddress: request.ip,
    location: await this.getLocationFromIP(request.ip),
  });
}
```

## 📊 Monitoring

### Get Queue Statistics

```typescript
const stats = await this.mailService.getQueueStats();

console.log(stats);
// Output:
// {
//   waiting: 5,
//   active: 2,
//   completed: 1000,
//   failed: 3,
//   delayed: 0,
//   total: 1010
// }
```

### Clean Old Jobs

```typescript
// Clean completed jobs older than 24 hours
await this.mailService.cleanCompletedJobs(24 * 60 * 60 * 1000);

// Clean failed jobs older than 7 days
await this.mailService.cleanFailedJobs(7 * 24 * 60 * 60 * 1000);
```

## ⚙️ Configuration

### Environment Variables

Tambahkan ke `.env`:

```env
# Redis Configuration (untuk BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Mail Configuration (sudah ada)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_IGNORE_TLS=false
MAIL_SECURE=false
MAIL_REQUIRE_TLS=true
MAIL_DEFAULT_EMAIL=noreply@keramik-store.com
MAIL_DEFAULT_NAME=Keramik Store

# Frontend URL (untuk generate verification/reset links)
FRONTEND_DOMAIN=http://localhost:3000
```

### Docker Compose (Redis)

Jika belum ada Redis, tambahkan ke `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: keramik-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  redis_data:
```

## 🔧 Customization

### Mengubah Job Options

Edit [mail-queue.constants.ts](./constants/mail-queue.constants.ts):

```typescript
export const MAIL_JOB_OPTIONS = {
  MAX_ATTEMPTS: 5,              // Ubah dari 3 ke 5
  BACKOFF_DELAY: 10000,         // Ubah dari 5000ms ke 10000ms
  BACKOFF_TYPE: 'fixed' as const, // Ubah dari exponential ke fixed
  // ...
};
```

### Menambah Tipe Email Baru

1. **Tambah enum** di [mail-job.enum.ts](./enums/mail-job.enum.ts):
```typescript
export enum MailJobType {
  // ... existing types ...
  ORDER_CONFIRMATION = 'order-confirmation',
}
```

2. **Tambah interface** di [mail-job-data.interface.ts](./interfaces/mail-job-data.interface.ts):
```typescript
export interface IOrderConfirmationData {
  to: string;
  name: string;
  orderNumber: string;
  orderItems: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
}
```

3. **Tambah method di MailService** [mail.service.ts](./mail.service.ts):
```typescript
async sendOrderConfirmation(data: IOrderConfirmationData): Promise<void> {
  await this.mailQueue.add(
    MailJobType.ORDER_CONFIRMATION,
    {
      to: data.to,
      subject: 'Order Confirmation',
      type: MailJobType.ORDER_CONFIRMATION,
      context: data,
    },
    { priority: MailJobPriority.HIGH }
  );
}
```

4. **Tambah handler di MailProcessor** [mail.processor.ts](./mail.processor.ts):
```typescript
async process(job: Job<IMailJobData>): Promise<void> {
  switch (job.data.type) {
    // ... existing cases ...
    case MailJobType.ORDER_CONFIRMATION:
      await this.sendOrderConfirmation(job);
      break;
  }
}

private async sendOrderConfirmation(job: Job<IMailJobData>): Promise<void> {
  const data = job.data.context as IOrderConfirmationData;
  const templatePath = join(__dirname, '..', 'mail', 'templates', 'order-confirmation.hbs');
  
  await this.mailerService.sendMail({
    to: data.to,
    subject: `Order Confirmation #${data.orderNumber}`,
    templatePath,
    context: { ...data, year: new Date().getFullYear() },
  });
}
```

5. **Buat template** `templates/order-confirmation.hbs`

## 🧪 Testing

### Unit Test Example

```typescript
import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let mockQueue: any;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
    };

    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: getQueueToken('mail-queue'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should queue verification email', async () => {
    await service.sendVerificationEmail({
      to: 'test@example.com',
      name: 'Test User',
      token: 'test-token',
    });

    expect(mockQueue.add).toHaveBeenCalledWith(
      'verification-email',
      expect.objectContaining({
        to: 'test@example.com',
        type: 'verification-email',
      }),
      expect.any(Object),
    );
  });
});
```

## 📈 Best Practices

1. **Always use queue untuk email** - Jangan kirim email synchronously
2. **Set proper priority** - Critical emails (security) harus priority tinggi
3. **Monitor queue stats** - Track waiting, active, failed jobs
4. **Clean old jobs regularly** - Prevent Redis memory bloat
5. **Test email templates** - Use email testing services
6. **Handle failures gracefully** - Log dan alert untuk permanent failures
7. **Rate limit properly** - Prevent hitting email provider limits

## 🔍 Troubleshooting

### Jobs not processing?

1. Check Redis connection:
```bash
redis-cli ping
# Should return: PONG
```

2. Check queue stats:
```typescript
const stats = await mailService.getQueueStats();
console.log(stats);
```

### Emails not sending?

1. Check MailerService configuration
2. Check email provider credentials
3. Check job logs in processor
4. Check failed jobs:
```typescript
const failed = await mailQueue.getFailed();
console.log(failed.map(j => j.failedReason));
```

## 📚 References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Handlebars Documentation](https://handlebarsjs.com/)
- [Redis Documentation](https://redis.io/documentation)

---

**Last Updated:** January 9, 2026
**Version:** 1.0.0
