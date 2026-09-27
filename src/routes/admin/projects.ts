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

import {
	getClient,
} from '../../database/client';

import {
	storeImage,
	fileLimitSize,
	deleteImage,
} from '../../utils/image';


const route = new Elysia({ prefix: '/projects' })
	.get('/', async () =>
	{
		const list = await getClient().conn
			.selectFrom('projects')
			.select([
				'id',
				'comment',
				'icon_filename',
				'icon_size',
				'hidden',
			])
			.execute();

		return list;
	})
;

export default route;
