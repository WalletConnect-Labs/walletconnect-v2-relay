import redis from "redis";
import { Subscription, Notification, WakuPublishParams } from "./types";
import bluebird from "bluebird";

import config from "./config";

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const redisClient: any = redis.createClient(config.redis);

const subs: Subscription[] = [];

export const setSub = (subscriber: Subscription) => subs.push(subscriber);
export const getSub = (topic: string) =>
  subs.filter(
    (subscriber) =>
      subscriber.topic === topic && subscriber.socket.readyState === 1
  );

export const setPub = async (params: WakuPublishParams) => {
  await redisClient.lpushAsync(
    `request:${params.topic}`,
    JSON.stringify(params.payload)
  );
  // TODO: need to handle ttl
  // await redisClient.expireAsync(`request:${params.topic}`, params.ttl);
};

export const getPub = (topic: string): string[] => {
  return redisClient
    .lrangeAsync(`request:${topic}`, 0, -1)
    .then((data: any) => {
      if (data) {
        const localData: string[] = data.map((item: string) =>
          JSON.parse(item)
        );
        redisClient.del(`request:${topic}`);
        return localData;
      }
      return;
    });
};

export const setNotification = (notification: Notification) =>
  redisClient.lpushAsync(
    `notification:${notification.topic}`,
    JSON.stringify(notification)
  );

export const getNotification = (topic: string) => {
  return redisClient
    .lrangeAsync(`notification:${topic}`, 0, -1)
    .then((data: any) => {
      if (data) {
        return data.map((item: string) => JSON.parse(item));
      }
      return;
    });
};
