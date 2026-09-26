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

import Elysia from 'elysia';
import cors from '@elysia/cors';
import staticPlugin from '@elysia/static';

import illustrationsRouter from './illustrations';


const publicRouter = new Elysia()
	.onError(({ status, code, path, error }) =>
	{
		switch (code) {
			case 'INTERNAL_SERVER_ERROR': {
				console.error(path, '\n', error);
				break;
			}
			case 'NOT_FOUND':
			case 'VALIDATION': {
				if (code === 'VALIDATION' && process.env.NODE_ENV !== 'production') {
					console.log(error.detail(error.message));
				}

				return status(400, {
					error: {
						message: `Bad request.`,
					},
				});
			}
			case 401:
			case 403: {
				return status(code, {
					error: {
						message: `Unauthorized.`,
					},
				});
			}
		}

		return {
			error: {
				message: `Something went wrong.`,
			},
		};
	})
	.use(cors())
	.use(staticPlugin({
		assets: process.env.ASSETS_DIRECTORY,
		prefix: '/assets',
	}))
	.use(illustrationsRouter)
;

export default publicRouter;
