import Redis from "ioredis";
import { Client as MinioClient } from "minio";

import { env } from "@/src/shared/config/env";
import { prisma } from "@/src/shared/db/prisma";

type Check = { status: "up" | "down"; latencyMs: number; message?: string };

async function check(run: () => Promise<unknown>): Promise<Check> {
  const started = Date.now();
  try {
    await Promise.race([
      run(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 1200)),
    ]);
    return { status: "up", latencyMs: Date.now() - started };
  } catch (error) {
    return {
      status: "down",
      latencyMs: Date.now() - started,
      message: error instanceof Error ? error.message : "unknown error",
    };
  }
}

export async function GET() {
  const redis = new Redis(env.REDIS_URL, { lazyConnect: true, connectTimeout: 800, maxRetriesPerRequest: 0 });
  const endpoint = new URL(env.S3_ENDPOINT);
  const minio = new MinioClient({
    endPoint: endpoint.hostname,
    port: Number(endpoint.port || (endpoint.protocol === "https:" ? 443 : 80)),
    useSSL: endpoint.protocol === "https:",
    accessKey: env.S3_ACCESS_KEY,
    secretKey: env.S3_SECRET_KEY,
    region: env.S3_REGION,
  });

  const [database, redisStatus, objectStorage] = await Promise.all([
    check(() => prisma.$queryRaw`SELECT 1`),
    check(async () => {
      await redis.connect();
      await redis.ping();
    }),
    check(() => minio.listBuckets()),
  ]);
  redis.disconnect();

  const dependencies = { database, redis: redisStatus, objectStorage };
  const healthy = Object.values(dependencies).every((item) => item.status === "up");
  return Response.json(
    { status: healthy ? "ok" : "degraded", app: { status: "up", version: "0.1.0" }, dependencies },
    { status: healthy ? 200 : 503 },
  );
}
