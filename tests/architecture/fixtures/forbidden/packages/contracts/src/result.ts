import Fastify from 'fastify';
import { result } from '../../../apps/api/src/application/use-cases/read.js';
export const leaked = [Fastify, result];
