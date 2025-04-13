import { Request, Response, NextFunction } from 'express';
import { defaultCorsOptions, createCorsMiddleware } from './cors';

/**
 * Middleware to protect admin routes with stricter CORS settings
 */
export const adminCorsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // For admin routes, we apply stricter CORS policy
  const adminCorsMiddleware = createCorsMiddleware({
    // Only allow admin requests from specific origins
    origin: [
      'https://readdash.com',
      'https://admin.readdash.com',    // Dedicated admin subdomain
      'http://localhost:5173',         // Local development
      'http://localhost:5001',         // Local API server
    ],
    // Require stricter credentials checking for admin routes
    credentials: true,
    // Additional security headers for admin routes
    exposedHeaders: ['Content-Length', 'X-Admin-Token'],
  });
  
  // Apply the admin CORS middleware
  adminCorsMiddleware(req, res, next);
};

/**
 * Middleware function to verify and apply appropriate CORS settings
 * based on the requested route
 */
export const routeSpecificCorsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Apply specific CORS settings based on the route path
  if (req.path.startsWith('/api/admin')) {
    adminCorsMiddleware(req, res, next);
  } else {
    // Use default CORS for non-admin routes
    const defaultCors = createCorsMiddleware();
    defaultCors(req, res, next);
  }
};