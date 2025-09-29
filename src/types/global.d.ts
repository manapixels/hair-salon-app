// Global type declarations

declare global {
  var otpStore:
    | Map<
        string,
        {
          phoneNumber: string;
          otp: string;
          expiresAt: Date;
          attempts: number;
        }
      >
    | undefined;
}

export {};
