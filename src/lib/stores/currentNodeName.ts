import { writable } from 'svelte/store';

export const currentNodeName = writable<string | null>(null); 