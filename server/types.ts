
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      profileImageUrl: string;
      accessToken: string;
      refreshToken?: string;
    };
  }
}

export {};
