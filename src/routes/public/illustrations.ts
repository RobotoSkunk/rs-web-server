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


const route = new Elysia({ prefix: '/illustrations' })
	.get('/:lang', async ({ params: { lang }, status }) =>
	{
		try {
			const list = await getClient().conn
				.selectFrom(['illustrations', 'illustration_alts'])
				.select(({ eb }) => [
					'picture_filename',
					'picture_small_filename',
					'picture_size',
					'picture_small_size',
					'created_at',

					eb.selectFrom('illustration_alts')
						.whereRef('illustration_id', '=', 'illustrations.id')
						.where('lang', '=', lang)
						.select('illustration_alts.content')
						.as('name'),

					eb.selectFrom('illustration_alts')
						.whereRef('illustration_id', '=', 'illustrations.id')
						.where('lang', '=', lang)
						.select('illustration_alts.description')
						.as('description'),
				])
				.where('hidden', '=', false)
				.where('illustration_alts.lang', '=', lang)
				.orderBy('created_at', 'desc')
				.execute();

			return list.map((v) => ({
				...v,
				created_at: (v.created_at as Date).toISOString().split('T')[0]!
			}));
		} catch (e) {
			console.error(e);

			return status(500, {
				error: {
					message: 'Internal server error.',
				},
			});
		}
	}, {
		params: t.Object({
			lang: t.String({ pattern: 'es-MX|en-US' }),
		}),
	})
;

export default route;
