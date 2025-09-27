import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

export default authkitMiddleware();

export const config = {
    matcher: ['/', '/profiles', '/dashboard', '/profile/new', '/calendar', '/settings', '/support']
};