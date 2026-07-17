import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/ai_content"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  S3_ENDPOINT: z.string().url().default("http://localhost:9000"),
  S3_ACCESS_KEY: z.string().default("minioadmin"),
  S3_SECRET_KEY: z.string().default("minioadmin"),
  S3_REGION: z.string().default("us-east-1"),
  DEFAULT_WORKSPACE_SLUG: z.string().default("local"),
  DEFAULT_USER_EMAIL: z.string().email().default("local@ai-content.test"),
  PROJECT_QUOTA_BYTES: z.coerce.bigint().default(1_073_741_824n),
  LOG_LEVEL: z.string().default("info"),
});

export const env = envSchema.parse(process.env);
