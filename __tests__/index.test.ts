import assert from "node:assert";
import { distributedDebounce, wait } from "../src";
import * as redis from "redis";
import { describe, beforeEach, it } from "mocha";
import crypto from 'crypto'

const redisClient = redis.createClient({ url: "redis://127.0.0.1:6379" });

describe("Debounce", () => {
  let rc;
  beforeEach("connect redis client", async () => {
    if (!rc) {
      rc = await redisClient.connect();
    }
  });

  it("atomicity", async () => {
    let counter = 0;
    const key = `dist:debounce:call:atomicity:${crypto.randomUUID()}`;
    for (let i = 0; i < 50; i++) {
      distributedDebounce(
        () => {
          counter++;
        },
        {
          wait: 0.4,
          key,
          redisclient: rc,
        }
      );
    }

    await wait(1300);
    assert(counter === 1);
  });

  it("debounce", async () => {
    let lastExecuted = -1;
    let counter = 0;
    const key = `dist:debounce:call:debounce:${crypto.randomUUID()}`;
    for (let i = 0; i < 30; i++) {
      distributedDebounce(
        () => {
          lastExecuted = i;
          counter++;
        },
        {
          wait: 1,
          key,
          redisclient: rc,
        }
      );
      await wait(10);
    }
    await wait(1300);
    assert(lastExecuted === 29);
    assert(counter === 1);
  });

  it("key", async () => {
    let counter = 0;
    for (let i = 0; i < 10; i++) {
      distributedDebounce(
        () => {
          counter++;
        },
        {
          wait: 1,
          key: `dist:debounce:call:key-${crypto.randomUUID()}`,
          redisclient: rc,
        }
      );
      await wait(10);
    }
    await wait(1300);
    assert.equal(counter, 10)
  });
});
