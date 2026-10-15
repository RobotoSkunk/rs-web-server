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


type Picture = {
	id: string;
	picture: {
		filename: string;
		size: {
			x: number;
			y: number;
		};
	};
	alts: {
		id?: UUID;
		lang: string;
		content: string;
	}[];
};

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
	.post('/order', async ({ body, status }) =>
	{
		const { count } = await getClient().conn
			.selectFrom('projects')
			.select(({ fn }) => fn.countAll().as('count'))
			.executeTakeFirstOrThrow();

		if (body.length != count) {
			return status(400, {
				error: {
					message: 'Bad request.',
				},
			});
		}

		for (let i = 0; i < body.length; i++) {
			await getClient().conn
				.updateTable('projects')
				.set({
					position: i,
				})
				.where('id', '=', body[i] as UUID)
				.execute();
		}

		return {
			success: true,
		};
	}, {
		body: t.Array(t.String({ format: 'uuid' })),
	})

	// Project
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

		const picturesToSend: Picture[] = [];

		for (const picture of pictures) {
			const alts = await getClient().conn
				.selectFrom('project_picture_alts')
				.select([
					'id',
					'lang',
					'content',
				])
				.where('project_picture_id', '=', picture.id!)
				.execute();

			picturesToSend.push({
				id: picture.id!,
				picture: {
					filename: picture.picture_small_filename,
					size: picture.picture_small_size as Point,
				},
				alts,
			});
		}

		const contents = await getClient().conn
			.selectFrom('project_contents')
			.select([
				'id',
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
			pictures: picturesToSend,
			contents,
		};
	}, {
		params: t.Object({
			id: t.String({ format: 'uuid' }),
		}),
	})
	.patch('/:id', async ({ params: { id }, body, status }) =>
	{
		const project = await getClient().conn
			.selectFrom('projects')
			.select([
				'id',
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

		await getClient().conn
			.updateTable('projects')
			.set({
				comment: body.comment,
				hidden: body.hidden,
			})
			.where('id', '=', id as UUID)
			.execute();

		return {
			success: true,
		};
	}, {
		params: t.Object({
			id: t.String({ format: 'uuid' }),
		}),
		body: t.Partial(t.Object({
			comment: t.String(),
			hidden: t.Boolean(),
		})),
	})
	.delete('/:id', async ({ params: { id }, status }) =>
	{
		const project = await getClient().conn
			.selectFrom('projects')
			.select([
				'id',
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

		await getClient().conn
			.deleteFrom('projects')
			.where('id', '=', id as UUID)
			.execute();

		return {
			success: true,
		};
	}, {
		params: t.Object({
			id: t.String({ format: 'uuid' }),
		}),
	})

	// Content
	.post('/:id/content', async ({ params: { id }, body, status }) =>
	{
		const project = await getClient().conn
			.selectFrom('projects')
			.select('id')
			.where('id', '=', id as UUID)
			.executeTakeFirst();

		if (!project) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		const insertResponse = await getClient().conn
			.insertInto('project_contents')
			.values({
				lang: body.lang,
				name: body.name,
				description: body.description,
				project_id: project.id!,
			})
			.returning('id')
			.executeTakeFirstOrThrow();

		return {
			id: insertResponse.id,
		};
	}, {
		params: t.Object({
			id: t.String({ format: 'uuid' }),
		}),
		body: t.Object({
			lang: t.String(),
			name: t.String(),
			description: t.String(),
		}),
	})
	.patch('/content/:id', async ({ params: { id }, body, status }) =>
	{
		const content = await getClient().conn
			.selectFrom('project_contents')
			.select('id')
			.where('id', '=', id as UUID)
			.executeTakeFirst();

		if (!content) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await getClient().conn
			.updateTable('project_contents')
			.set({
				lang: body.lang,
				name: body.name,
				description: body.description,
			})
			.where('id', '=', id as UUID)
			.execute();

		return {
			success: true,
		};
	}, {
		params: t.Object({
			id: t.String({ format: 'uuid' }),
		}),
		body: t.Partial(t.Object({
			lang: t.String(),
			name: t.String(),
			description: t.String(),
		})),
	})
	.delete('/content/:id', async ({ params: { id }, status }) =>
	{
		const content = await getClient().conn
			.selectFrom('project_contents')
			.select('id')
			.where('id', '=', id as UUID)
			.executeTakeFirst();

		if (!content) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await getClient().conn
			.deleteFrom('project_contents')
			.where('id', '=', id as UUID)
			.execute();

		return {
			success: true,
		};
	}, {
		params: t.Object({
			id: t.String({ format: 'uuid' }),
		}),
	})

	// Pictures
	.post('/:id/picture', async ({ params: { id }, body, status }) =>
	{
		const project = await getClient().conn
			.selectFrom('projects')
			.select('id')
			.where('id', '=', id as UUID)
			.executeTakeFirst();

		if (!project) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		const picture = await storeImage(body.picture);
		const pictureSmall = await storeImage(body.picture_small);

		if (!picture || !pictureSmall) {
			return status(400, {
				error: {
					message: 'Bad request.',
				},
			});
		}

		const { count } = await getClient().conn
			.selectFrom('project_pictures')
			.select(({ fn }) => fn.countAll().as('count'))
			.where('project_id', '=', project.id!)
			.executeTakeFirstOrThrow();

		const insertResponse = await getClient().conn
			.insertInto('project_pictures')
			.values({
				picture_filename: picture.filename,
				picture_size: `(${picture.size.x},${picture.size.y})`,
				picture_small_filename: pictureSmall.filename,
				picture_small_size: `(${pictureSmall.size.x},${pictureSmall.size.y})`,
				position: count as number,
				project_id: project.id!,
			})
			.returning('id')
			.executeTakeFirstOrThrow();

		return {
			id: insertResponse.id,
		};
	}, {
		params: t.Object({
			id: t.String({ format: 'uuid' }),
		}),
		body: t.Object({
			picture: t.String(),
			picture_small: t.String(),
		}),
	})
	.delete('/picture/:id', async ({ params: { id }, status }) =>
	{
		const projectPicture = await getClient().conn
			.selectFrom('project_pictures')
			.select([
				'id',
				'picture_filename',
				'picture_small_filename',
			])
			.where('id', '=', id as UUID)
			.executeTakeFirst();

		if (!projectPicture) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await deleteImage(projectPicture.picture_filename);
		await deleteImage(projectPicture.picture_small_filename);

		await getClient().conn
			.deleteFrom('project_pictures')
			.where('id', '=', projectPicture.id!)
			.execute();

		return {
			success: true,
		};
	}, {
		params: t.Object({
			id: t.String({ format: 'uuid' }),
		}),
	})
	.post('/picture/order', async ({ body, status }) =>
	{
		const { count } = await getClient().conn
			.selectFrom('project_pictures')
			.select(({ fn }) => fn.countAll().as('count'))
			.executeTakeFirstOrThrow();

		if (body.length != count) {
			return status(400, {
				error: {
					message: 'Bad request.',
				},
			});
		}

		for (let i = 0; i < body.length; i++) {
			await getClient().conn
				.updateTable('project_pictures')
				.set({
					position: i,
				})
				.where('id', '=', body[i] as UUID)
				.execute();
		}

		return {
			success: true,
		};
	}, {
		body: t.Array(t.String({ format: 'uuid' })),
	})

	// Picture alts
	.post('/picture/:id/alt', async ({ params: { id }, body, status }) =>
	{
		const projectPicture = await getClient().conn
			.selectFrom('project_pictures')
			.select('id')
			.where('id', '=', id as UUID)
			.executeTakeFirst();

		if (!projectPicture) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		const insertResponse = await getClient().conn
			.insertInto('project_picture_alts')
			.values({
				lang: body.lang,
				content: body.content,
				project_picture_id: projectPicture.id!,
			})
			.returning('id')
			.executeTakeFirstOrThrow();

		return {
			id: insertResponse.id,
		};
	}, {
		params: t.Object({
			id: t.String({ format: 'uuid' }),
		}),
		body: t.Object({
			lang: t.String(),
			content: t.String(),
		}),
	})
	.patch('/picture/alt/:id', async ({ params: { id }, body, status }) =>
	{
		const pictureAlt = await getClient().conn
			.selectFrom('project_picture_alts')
			.select('id')
			.where('id', '=', id as UUID)
			.executeTakeFirst();

		if (!pictureAlt) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await getClient().conn
			.updateTable('project_picture_alts')
			.set({
				lang: body.lang,
				content: body.content,
			})
			.where('id', '=', pictureAlt.id!)
			.executeTakeFirstOrThrow();

		return {
			success: true
		};
	}, {
		params: t.Object({
			id: t.String({ format: 'uuid' }),
		}),
		body: t.Partial(t.Object({
			lang: t.String(),
			content: t.String(),
		})),
	})
	.delete('/picture/alt/:id', async ({ params: { id }, status }) =>
	{
		const pictureAlt = await getClient().conn
			.selectFrom('project_picture_alts')
			.select('id')
			.where('id', '=', id as UUID)
			.executeTakeFirst();

		if (!pictureAlt) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await getClient().conn
			.deleteFrom('project_picture_alts')
			.where('id', '=', pictureAlt.id!)
			.execute();

		return {
			success: true,
		};
	}, {
		params: t.Object({
			id: t.String({ format: 'uuid' }),
		}),
	})
;

export default route;
