/**
 * robotoskunk.com server side. The backend part of robotoskunk.com
 * Copyright (C) 2026  Edgar Lima (RobotoSkunk)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/

import {
	Elysia,
	t,
} from 'elysia';

import AuthToken from '../entities/auth-token';


export const authTokenModel = new Elysia({ name: 'auth' })
	.guard({
		cookie: t.Cookie({
			auth_token: t.String({ pattern: '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$' }),
		}),
	})
	.resolve({ as: 'scoped' }, async ({ cookie: { auth_token }, status }) =>
	{
		if (!auth_token || !auth_token.value) {
			throw status(401, {
				error: {
					message: 'Unauthorized.',
				},
			});
		}

		const token = await AuthToken.authenticate(auth_token.value as string);

		if (!token) {
			auth_token.remove();

			throw status(401, {
				error: {
					message: 'Unauthorized.',
				},
			});
		}

		return {
			authToken: token,
		};
	});
