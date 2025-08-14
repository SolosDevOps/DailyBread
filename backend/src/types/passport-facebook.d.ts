declare module "passport-facebook" {
  import { Strategy as PassportStrategy } from "passport-strategy";
  import { Request } from "express";

  export interface Profile {
    id: string;
    displayName?: string;
    emails?: Array<{ value: string }>;
    photos?: Array<{ value: string }>;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    profileFields?: string[];
    enableProof?: boolean;
    passReqToCallback?: boolean;
  }

  export class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any, info?: any) => void
      ) => void
    );
  }

  export { Strategy as FacebookStrategy };
}
