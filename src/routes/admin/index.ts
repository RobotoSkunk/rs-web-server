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
	authTokenModel,
} from '../../models/auth-token';

import Elysia from 'elysia';

import authRouter from './auth';
import illustrationsRouter from './illustrations';
import staticPlugin from '@elysia/static';


const adminRouter = new Elysia()
	.use(authRouter)
	.use(authTokenModel)

	// v v v v [ Requires Auth Token from here ] v v v v //

	.use(staticPlugin({
		assets: process.env.ASSETS_DIRECTORY,
		prefix: '/assets',
	}))

	.get('/identity', ({ authToken }) =>
	{
		return {
			id: authToken.admin.id,
			username: authToken.admin.username,
		};
	})
	.use(illustrationsRouter)
;

export default adminRouter;
