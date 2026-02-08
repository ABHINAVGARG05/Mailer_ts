import redisClient from "../db/redisConnection";

export const keys = {
  get: async (key: string): Promise<string | null> => {
    return await redisClient.get(key);
  },
  set: async (key: string, data: string | object | number): Promise<string | null> => {

    const value = typeof data === "string" ? data : JSON.stringify(data);
    return await redisClient.set(key, value);
  },
  del: async (key: string): Promise<number> => {
    return await redisClient.del(key);
  },
  exists: async (key: string): Promise<number> => {
    return await redisClient.exists(key);
  },

  setex: async (
    key: string,
    seconds: number,
    data: string | object | number
  ): Promise<string | null> => {
    const value = typeof data === "string" ? data : JSON.stringify(data);
    return await redisClient.setex(key, seconds, value);
  },
};
