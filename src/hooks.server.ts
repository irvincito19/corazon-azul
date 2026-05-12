import { getUser } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const user = await getUser(event.cookies);
	event.locals.user = user;

	if (!user && !event.url.pathname.startsWith('/login')) {
		throw redirect(303, '/login');
	}

	if (user && event.url.pathname.startsWith('/login')) {
		throw redirect(303, '/');
	}

	const response = await resolve(event);
	return response;
};
