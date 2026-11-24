import Fastify from 'fastify';
import { readFile } from 'node:fs';
import { controller } from '../../api/controllers/read.js';
import { store } from '../../infrastructure/store.js';
export const result = [Fastify, readFile, controller, store];
