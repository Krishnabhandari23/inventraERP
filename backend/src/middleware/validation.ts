import { body, param, query, ValidationChain } from 'express-validator';

export const loginValidation: ValidationChain[] = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const createUserValidation: ValidationChain[] = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').optional().isString(),
  body('role').isIn(['owner', 'manager', 'finance', 'production', 'worker']).withMessage('Invalid role'),
];

export const idParamValidation: ValidationChain[] = [
  param('id').isString().withMessage('Valid ID is required'),
];

export const paginationValidation: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];
