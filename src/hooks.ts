import type { Handle } from '@sveltejs/kit';

/**
 * The site is published as static files and runs entirely in the browser, so render nothing on
 * the server in development either: what you see locally is what production serves.
 */
export const handle: Handle = async ({ event, resolve }) => resolve(event, { ssr: false });
