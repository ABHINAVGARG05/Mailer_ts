import redisClient from "../db/redisConnection";

export const keys = {
  get: async (key: string) => {
    return await redisClient.get(key);
  },
  set: async (key: string, data: string | object | number) => {
    return await redisClient.set(key, JSON.stringify(data));
  },
  del: async (key: string) => {
    return await redisClient.del(key)
  }
};
