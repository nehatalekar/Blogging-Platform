/**
 * Environment variable validation for production deployment
 */

const requiredEnvVars = [
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "DATABASE_URL",
  "SMTP_HOST",
  "SMTP_PORT",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
];

export function validateEnv() {
  const missing: string[] = [];

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  if (missing.length > 0) {
    const error = new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
    console.error(error.message);
    throw error;
  }
}

/**
 * Safely get environment variable with type safety
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}
