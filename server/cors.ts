import cors from 'cors';
import { CorsOptions } from 'cors';

/**
 * Default CORS configuration for ReadDash application
 */
export const defaultCorsOptions: CorsOptions = {
  origin: [
    'https://readdash.com',                // Production domain
    'https://www.readdash.com',            // Production www subdomain
    'https://staging.readdash.com',        // Staging environment
    'http://localhost:5173',               // Vite dev server default
    'http://localhost:5001',               // Local API server
    'http://127.0.0.1:5173',               // Alternative localhost
    'http://127.0.0.1:5001',               // Alternative localhost
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,                        // Allow cookies to be sent with requests
  maxAge: 86400,                            // Cache preflight request results for 24 hours (in seconds)
  optionsSuccessStatus: 204                 // Return 204 for preflight requests
};

/**
 * Create a CORS middleware with custom options
 * @param options - Custom CORS options to override defaults
 * @returns CORS middleware configured with provided options
 */
export const createCorsMiddleware = (options?: Partial<CorsOptions>) => {
  return cors({
    ...defaultCorsOptions,
    ...options
  });
};

/**
 * Create a dynamic CORS middleware that can handle origin validation logic
 * @param originValidator - Function to determine if an origin is allowed
 * @returns CORS middleware with dynamic origin validation
 */
export const createDynamicCorsMiddleware = (
  originValidator: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void
) => {
  return cors({
    ...defaultCorsOptions,
    origin: originValidator
  });
};