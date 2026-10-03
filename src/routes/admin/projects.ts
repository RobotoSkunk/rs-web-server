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
			.orderBy('position', 'asc')
			.execute();

		return list;
	})
	.post('/', async ({ body, status }) =>
	{
		if (body.icon.length > fileLimitSize) {
			return status(413, {
				error: {
					message: 'The maximum file size allowed is 10 MiB.',
				},
			});
		}

		const icon = await storeImage(body.icon);

		if (!icon) {
			return status(400, {
				error: {
					message: 'Bad request.',
				},
			});
		}

		const { count } = await getClient().conn
			.selectFrom('projects')
			.select(eb => eb.fn.countAll().as('count'))
			.executeTakeFirstOrThrow();

		const { id } = await getClient().conn
			.insertInto('projects')
			.values({
				position: count as number,
				comment: body.comment,
				icon_filename: icon.filename,
				icon_size: `(${icon.size.x}, ${icon.size.y})`,
			})
			.returning('id')
			.executeTakeFirstOrThrow();

		return {
			success: true,
			id,
			icon: {
				filename: icon.filename,
				size: icon.size,
			},
		};
	}, {
		body: t.Object({
			comment: t.String(),
			icon: t.String(),
		}),
	})
	.get('/:id', async ({ params: { id }, status }) =>
	{
		const project = await getClient().conn
			.selectFrom('projects')
			.select([
				'comment',
				'icon_filename',
				'icon_size',
				'hidden',
			])
			.where('id', '=', id as UUID)
			.executeTakeFirst();

		if (!project) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		const pictures = await getClient().conn
			.selectFrom('project_pictures')
			.select([
				'id',
				'picture_small_filename',
				'picture_small_size',
			])
			.where('project_id', '=', id as UUID)
			.orderBy('position', 'asc')
			.execute();

		const contents = await getClient().conn
			.selectFrom('project_contents')
			.select([
				'lang',
				'name',
				'description',
			])
			.where('project_id', '=', id as UUID)
			.execute();

		return {
			comment: project.comment,
			hidden: project.hidden,
			icon: {
				filename: project.icon_filename,
				size: project.icon_size,
			},
			pictures: pictures.map((v) =>
			({
				id: v.id,
				picture: {
					filename: v.picture_small_filename,
					size: v.picture_small_size,
				},
			})),
			contents,
		};
	}, {
		params: t.Object({
			id: t.String({ format: 'uuid' }),
		}),
	})
;

export default route;
