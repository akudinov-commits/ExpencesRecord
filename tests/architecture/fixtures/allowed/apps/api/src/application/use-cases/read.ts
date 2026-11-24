import type { Store } from '../ports/store.js';
export const read = (store: Store) => store.read();
