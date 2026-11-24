import Fastify from 'fastify';
import { readFile } from 'node:fs';
import { result } from '../../api/src/application/use-cases/read.js';
export const display = [Fastify, readFile, result];
