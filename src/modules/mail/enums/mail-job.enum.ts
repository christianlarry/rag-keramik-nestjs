/**
 * Enum untuk tipe-tipe email job yang ada di sistem
 * Berdasarkan authentication flow dan kebutuhan aplikasi
 */
export enum MailJobType {
  /**
   * Email verifikasi akun setelah registrasi
   * Template: verification-email.hbs
   */
  VERIFICATION_EMAIL = 'verification-email',

  /**
   * Email untuk reset password (forgot password flow)
   * Template: reset-password.hbs
   */
  RESET_PASSWORD = 'reset-password',

  /**
   * Email konfirmasi setelah password berhasil diubah
   * Template: password-changed.hbs
   */
  PASSWORD_CHANGED = 'password-changed',

  /**
   * Email welcome setelah verifikasi berhasil
   * Template: welcome.hbs
   */
  WELCOME = 'welcome',

  /**
   * Email notifikasi login dari perangkat baru (optional)
   * Template: new-login.hbs
   */
  NEW_LOGIN_NOTIFICATION = 'new-login-notification',

  /**
   * Email alert untuk aktivitas mencurigakan (optional)
   * Template: suspicious-activity.hbs
   */
  SUSPICIOUS_ACTIVITY = 'suspicious-activity',
}

/**
 * Priority level untuk email jobs
 */
export enum MailJobPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4,
}
