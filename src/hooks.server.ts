import type { Handle } from '@sveltejs/kit';

/**
 * Auth placeholder — replace with LDAP or other authentication when ready.
 *
 * Currently sets a default local user on every request.
 * To enable authentication, replace the body of this hook with
 * session/token validation and populate event.locals.user accordingly.
 */
export const handle: Handle = async ({ event, resolve }) => {
	// Placeholder: treat every request as an authenticated local user
	event.locals.user = {
		username: 'local',
		displayName: 'Local User',
		isAuthenticated: true
	};

	return resolve(event);
};
