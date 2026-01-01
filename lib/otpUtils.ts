import bcrypt from 'bcryptjs';

/**
 * OTP Utility Functions
 * Handles OTP generation, hashing, and verification
 */

/**
 * Generate a secure 6-digit numeric OTP
 * @returns 6-digit OTP string (e.g., "123456")
 */
export function generateOTP(): string {
  // Generate random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

/**
 * Hash OTP using bcrypt before storing in database
 * @param otp - Plain text 6-digit OTP
 * @returns Hashed OTP string
 */
export async function hashOTP(otp: string): Promise<string> {
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    throw new Error('Invalid OTP format for hashing');
  }
  
  // Use bcrypt with 10 rounds (good balance of security and performance)
  const saltRounds = 10;
  const hashedOTP = await bcrypt.hash(otp, saltRounds);
  return hashedOTP;
}

/**
 * Verify OTP by comparing plain text OTP with hashed OTP
 * @param plainOTP - Plain text OTP from user input
 * @param hashedOTP - Hashed OTP from database
 * @returns true if OTP matches, false otherwise
 */
export async function verifyOTP(plainOTP: string, hashedOTP: string): Promise<boolean> {
  if (!plainOTP || !hashedOTP) {
    return false;
  }
  
  if (!/^\d{6}$/.test(plainOTP)) {
    return false;
  }
  
  try {
    const isValid = await bcrypt.compare(plainOTP, hashedOTP);
    return isValid;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}

/**
 * Check if OTP has expired
 * @param expiresAt - Expiration timestamp
 * @returns true if expired, false otherwise
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Calculate OTP expiration time (5 minutes from now)
 * @returns Date object representing expiration time
 */
export function getOTPExpirationTime(): Date {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
  return expiresAt;
}

/**
 * Check if resend cooldown period has passed (60 seconds)
 * @param lastSentAt - Last sent timestamp
 * @returns true if cooldown passed, false otherwise
 */
export function canResendOTP(lastSentAt: Date | null): boolean {
  if (!lastSentAt) {
    return true; // Never sent before, can send
  }
  
  const now = new Date();
  const cooldownPeriod = 60 * 1000; // 60 seconds in milliseconds
  const timeSinceLastSend = now.getTime() - lastSentAt.getTime();
  
  return timeSinceLastSend >= cooldownPeriod;
}

/**
 * Get remaining cooldown time in seconds
 * @param lastSentAt - Last sent timestamp
 * @returns Remaining cooldown in seconds, or 0 if cooldown passed
 */
export function getRemainingCooldownSeconds(lastSentAt: Date | null): number {
  if (!lastSentAt) {
    return 0;
  }
  
  const now = new Date();
  const cooldownPeriod = 60 * 1000; // 60 seconds
  const timeSinceLastSend = now.getTime() - lastSentAt.getTime();
  const remaining = Math.max(0, Math.ceil((cooldownPeriod - timeSinceLastSend) / 1000));
  
  return remaining;
}

