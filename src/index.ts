// import { RedisClient } from "@types";

import { RedisClientType, createClient } from "redis";

// let client: ;
// import type { RedisClient } from "redis";
export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * distributed debounce function using redis.
 */
async function distributedDebounce(
  callback: () => any,
  args: {
    /**
     * wait is seconds.
     */
    wait: number;
    /**
     * callback function will be called debouncely with each key.
     */
    key: string;
    redisclient: ReturnType<typeof createClient>;
  }
) {
  let ownedTicket;
  try {
    [ownedTicket] = await args.redisclient
      .multi()
      .incr(args.key)
      .expire(args.key, args.wait)
      .exec();
  } catch (error) {
    console.log(error);
  }

  ownedTicket = ownedTicket?.toString();

  // wait for ttl sec.
  await wait(args.wait * 1000);

  let currentTicket = "";
  const currentTicketTemp = await args.redisclient.get(args.key);
  if (!currentTicketTemp) {
    currentTicket = ownedTicket?.toString() || "";
  }

  if (ownedTicket !== currentTicket) return;

  const a = await args.redisclient.set(`${args.key}_lock`, "", {
    NX: true,
    EX: 100,
  });

  if (a !== "OK") return;

  await callback();
}

export { distributedDebounce };
