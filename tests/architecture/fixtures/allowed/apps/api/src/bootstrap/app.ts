import { read } from '../api/controllers/read.js';
import { store } from '../infrastructure/store.js';
export const result = () => read(store);
