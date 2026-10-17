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


const route = new Elysia({ prefix: '/projects' })
	.get('/:lang', async ({ params: { lang }, status }) =>
	{
		try {
			const projects = await getClient().conn
				.selectFrom('projects')
				.select(({ selectFrom }) => [
					'id',
					'icon_filename',
					'icon_size',

					selectFrom('project_contents')
						.whereRef('project_contents.project_id', '=', 'projects.id')
						.where('lang', '=', lang)
						.select('project_contents.name')
						.as('name'),

					selectFrom('project_contents')
						.whereRef('project_contents.project_id', '=', 'projects.id')
						.where('lang', '=', lang)
						.select('project_contents.description')
						.as('description'),
				])
				.where('hidden', '=', false)
				.orderBy('position', 'asc')
				.execute();

			const list: unknown[] = [];

			for (const project of projects) {
				const pictures = await getClient().conn
					.selectFrom('project_pictures')
					.select(({ selectFrom }) => [
						'picture_filename',
						'picture_size',
						'picture_small_filename',
						'picture_small_size',

						selectFrom('project_picture_alts')
							.whereRef('project_picture_alts.project_picture_id', '=', 'project_pictures.id')
							.select('project_picture_alts.content')
							.where('project_picture_alts.lang', '=', lang)
							.as('alt'),
					])
					.where('project_id', '=', project.id!)
					.orderBy('position', 'asc')
					.execute();

				list.push({
					name: project.name,
					description: project.description,
					icon: {
						filename: project.icon_filename,
						size: project.icon_size,
					},
					pictures: pictures.map((picture) => ({
						picture: {
							filename: picture.picture_filename,
							size: picture.picture_size,
						},
						thumbnail: {
							filename: picture.picture_small_filename,
							size: picture.picture_small_size,
						},
						alt: picture.alt,
					})),
				});
			}

			return list;
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
