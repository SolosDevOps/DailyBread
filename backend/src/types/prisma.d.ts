// Type augmentation for Follow model
declare global {
  namespace PrismaClient {
    interface DefaultArgs {}
  }
}

// Extend Prisma client with Follow model
declare module "@prisma/client" {
  interface PrismaClient {
    follow: {
      findUnique<T>(args: {
        where: {
          followerId_followingId?: {
            followerId: number;
            followingId: number;
          };
        };
      }): Promise<T | null>;

      findMany<T>(args: {
        where?: {
          followerId?: number;
          followingId?: number;
        };
        include?: any;
        select?: any;
      }): Promise<T[]>;

      create<T>(args: {
        data: {
          followerId: number;
          followingId: number;
        };
      }): Promise<T>;

      delete<T>(args: {
        where: {
          followerId_followingId: {
            followerId: number;
            followingId: number;
          };
        };
      }): Promise<T>;

      count(args?: {
        where?: {
          followerId?: number;
          followingId?: number;
        };
      }): Promise<number>;
    };
  }
}

export {};
