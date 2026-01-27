import { UserGender, UserProvider, UserRole, UserStatus } from '../types/user.type';
import { AddressVO } from '../value-objects/address.vo';

/**
 * User Entity - Aggregate Root
 * 
 * Represents a user in the system with identity, authentication,
 * profile information, and business rules.
 * 
 * @aggregate-root User is the aggregate root for user-related operations
 */
export class User {
  // Identity
  private readonly _id: string;

  // Core Authentication
  private _email: string;
  private _emailVerified: boolean;
  private _emailVerifiedAt?: Date;
  private _passwordHash?: string;
  private _passwordChangedAt?: Date;

  // Profile Information
  private _firstName?: string;
  private _lastName?: string;
  private _gender: UserGender;
  private _dateOfBirth?: Date;
  private _phoneNumber?: string;
  private _phoneVerified: boolean;
  private _phoneVerifiedAt?: Date;
  private _avatarUrl?: string;

  // OAuth
  private _provider: UserProvider;
  private _providerId?: string;

  // Access Control
  private _role: UserRole;
  private _status: UserStatus;

  // Session Management
  private _refreshTokens: string[];

  // Audit
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _lastLoginAt?: Date;
  private _deletedAt?: Date;

  // Relationships
  private _addresses: AddressVO[];
  private _primaryAddress: AddressVO | null;

  constructor(props: UserProps) {
    this._id = props.id;
    this._email = props.email;
    this._emailVerified = props.emailVerified ?? false;
    this._emailVerifiedAt = props.emailVerifiedAt;
    this._passwordHash = props.passwordHash;
    this._passwordChangedAt = props.passwordChangedAt;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._gender = props.gender;
    this._dateOfBirth = props.dateOfBirth;
    this._phoneNumber = props.phoneNumber;
    this._phoneVerified = props.phoneVerified ?? false;
    this._phoneVerifiedAt = props.phoneVerifiedAt;
    this._avatarUrl = props.avatarUrl;
    this._provider = props.provider;
    this._providerId = props.providerId;
    this._role = props.role;
    this._status = props.status;
    this._refreshTokens = props.refreshTokens ?? [];
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
    this._lastLoginAt = props.lastLoginAt;
    this._deletedAt = props.deletedAt;
    this._addresses = props.addresses ?? [];
    this._primaryAddress = props.primaryAddress ?? null;
  }

  // =====================================================
  // Getters - Identity
  // =====================================================

  get id(): string {
    return this._id;
  }

  // =====================================================
  // Getters - Authentication
  // =====================================================

  get email(): string {
    return this._email;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get emailVerifiedAt(): Date | undefined {
    return this._emailVerifiedAt;
  }

  get passwordHash(): string | undefined {
    return this._passwordHash;
  }

  get passwordChangedAt(): Date | undefined {
    return this._passwordChangedAt;
  }

  // =====================================================
  // Getters - Profile
  // =====================================================

  get firstName(): string | undefined {
    return this._firstName;
  }

  get lastName(): string | undefined {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName || ''} ${this._lastName || ''}`.trim();
  }

  get gender(): UserGender {
    return this._gender;
  }

  get dateOfBirth(): Date | undefined {
    return this._dateOfBirth;
  }

  get phoneNumber(): string | undefined {
    return this._phoneNumber;
  }

  get phoneVerified(): boolean {
    return this._phoneVerified;
  }

  get phoneVerifiedAt(): Date | undefined {
    return this._phoneVerifiedAt;
  }

  get avatarUrl(): string | undefined {
    return this._avatarUrl;
  }

  // =====================================================
  // Getters - OAuth
  // =====================================================

  get provider(): UserProvider {
    return this._provider;
  }

  get providerId(): string | undefined {
    return this._providerId;
  }

  // =====================================================
  // Getters - Access Control
  // =====================================================

  get role(): UserRole {
    return this._role;
  }

  get status(): UserStatus {
    return this._status;
  }

  // =====================================================
  // Getters - Session
  // =====================================================

  get refreshTokens(): string[] {
    return [...this._refreshTokens];
  }

  // =====================================================
  // Getters - Audit
  // =====================================================

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  // =====================================================
  // Getters - Relationships
  // =====================================================

  get addresses(): AddressVO[] {
    return [...this._addresses];
  }

  // =====================================================
  // Business Logic - Status Checks
  // =====================================================

  get isActive(): boolean {
    return this._status === 'active';
  }

  get isInactive(): boolean {
    return this._status === 'inactive';
  }

  get isSuspended(): boolean {
    return this._status === 'suspended';
  }

  get isDeleted(): boolean {
    return this._status === 'deleted';
  }

  get isAdmin(): boolean {
    return this._role === 'admin';
  }

  get isCustomer(): boolean {
    return this._role === 'user';
  }

  get isAdult(): boolean {
    const adultAge = 18;

    if (!this._dateOfBirth) return false;
    const ageDifMs = Date.now() - this._dateOfBirth.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970) >= adultAge;
  }

  get age(): number | null {
    if (!this._dateOfBirth) return null;
    const ageDifMs = Date.now() - this._dateOfBirth.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  get hasPassword(): boolean {
    return !!this._passwordHash;
  }

  get isOAuthUser(): boolean {
    return this._provider !== 'local';
  }

  // =====================================================
  // Domain Methods - Profile Updates
  // =====================================================

  updateProfile(data: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    phoneNumber?: string;
    avatarUrl?: string;
  }): void {
    if (data.firstName !== undefined) {
      this._firstName = data.firstName;
    }
    if (data.lastName !== undefined) {
      this._lastName = data.lastName;
    }
    if (data.dateOfBirth !== undefined) {
      this._dateOfBirth = data.dateOfBirth;
    }
    if (data.phoneNumber !== undefined) {
      this._phoneNumber = data.phoneNumber;
    }
    if (data.avatarUrl !== undefined) {
      this._avatarUrl = data.avatarUrl;
    }
    this._updatedAt = new Date();
  }

  updateEmail(email: string): void {
    this._email = email;
    this._emailVerified = false;
    this._emailVerifiedAt = undefined;
    this._updatedAt = new Date();
  }

  verifyEmail(): void {
    this._emailVerified = true;
    this._emailVerifiedAt = new Date();
    this._updatedAt = new Date();
  }

  verifyPhone(): void {
    this._phoneVerified = true;
    this._phoneVerifiedAt = new Date();
    this._updatedAt = new Date();
  }

  // =====================================================
  // Domain Methods - Password Management
  // =====================================================

  updatePassword(hashedPassword: string): void {
    this._passwordHash = hashedPassword;
    this._passwordChangedAt = new Date();
    this._updatedAt = new Date();
  }

  // =====================================================
  // Domain Methods - Access Control
  // =====================================================

  changeRole(newRole: UserRole): void {
    this._role = newRole;
    this._updatedAt = new Date();
  }

  activate(): void {
    this._status = 'active';
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._status = 'inactive';
    this._updatedAt = new Date();
  }

  suspend(): void {
    this._status = 'suspended';
    this._updatedAt = new Date();
  }

  softDelete(): void {
    this._status = 'deleted';
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  // =====================================================
  // Domain Methods - Session Management
  // =====================================================

  recordLogin(): void {
    this._lastLoginAt = new Date();
  }

  addRefreshToken(token: string): void {
    this._refreshTokens.push(token);
  }

  removeRefreshToken(token: string): void {
    this._refreshTokens = this._refreshTokens.filter(t => t !== token);
  }

  revokeAllRefreshTokens(): void {
    this._refreshTokens = [];
  }

  hasRefreshToken(token: string): boolean {
    return this._refreshTokens.includes(token);
  }

  // =====================================================
  // Domain Methods - Address Management
  // =====================================================

  addAddress(address: AddressVO): void {
    // Max 3 addresses
    if (this._addresses.length >= 3) {
      throw new Error('Cannot add more than 3 addresses');
    }

    this._addresses.push(address);
    this._updatedAt = new Date();
  }

  removeAddress(address: AddressVO): void {
    this._addresses = this._addresses.filter(addr => !addr.equals(address));
    this._updatedAt = new Date();
  }

  getPrimaryAddress(): AddressVO | null {
    return this._primaryAddress
  }

  setPrimaryAddress(address: AddressVO) {
    // Ensure the address belongs to the user
    if (!this._addresses.some(a => a.equals(address))) {
      throw new Error('Address not owned by user')
    }
    this._primaryAddress = address
  }

  // =====================================================
  // Domain Methods - Validation
  // =====================================================

  canPerformAction(): boolean {
    return this.isActive && this._emailVerified;
  }

  canLogin(): boolean {
    return this.isActive || this.isInactive;
  }

  requiresPasswordChange(maxPasswordAge: number = 90): boolean {
    if (!this._passwordChangedAt) return false;

    const daysSinceChange =
      (Date.now() - this._passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceChange > maxPasswordAge;
  }
}

/**
 * Props for creating a User entity
 */
export interface UserProps {
  id: string;
  email: string;
  emailVerified?: boolean;
  emailVerifiedAt?: Date;
  passwordHash?: string;
  passwordChangedAt?: Date;
  firstName?: string;
  lastName?: string;
  gender: UserGender;
  dateOfBirth?: Date;
  phoneNumber?: string;
  phoneVerified?: boolean;
  phoneVerifiedAt?: Date;
  avatarUrl?: string;
  provider: UserProvider;
  providerId?: string;
  role: UserRole;
  status: UserStatus;
  refreshTokens?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
  deletedAt?: Date;
  addresses?: AddressVO[];
  primaryAddress?: AddressVO;
}