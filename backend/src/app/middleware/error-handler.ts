// src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';

export default function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error('Error:', error);

    res.status(500).json({
        error: {
            message: error.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
    });
}
