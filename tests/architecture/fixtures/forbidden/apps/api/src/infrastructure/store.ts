import { controller } from '../api/controllers/read.js';
import { result } from '../application/use-cases/read.js';
export const store = [controller, result];
