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


const route = new Elysia({ prefix: '/urls' })
	.get('/', async () =>
	{
		const urls = await getClient().conn
			.selectFrom('url_metadata')
			.select([
				'url',
				'site',
			])
			.execute();

		return urls;
	})
	.get('/query', async ({ query, status }) =>
	{
		const url = await getClient().conn
			.selectFrom('url_metadata')
			.selectAll()
			.where('url', '=', query.q)
			.executeTakeFirst();

		if (!url) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		return {
			url: url.url,
			site: url.site,
			title: url.title,
			description: url.description,
			image: url.picture_filename ? {
				data: url.picture_filename,
				size: url.picture_size,
				alt: url.picture_alt,
			} : null,
		};
	}, {
		query: t.Object({
			q: t.String(),
		}),
	})
	.post('/', async ({ body, status }) =>
	{
		if (body.image && body.image.data.length > fileLimitSize) {
			return status(413, {
				error: {
					message: 'The maximum file size allowed is 10 MiB.',
				},
			});
		}

		const metadata = await getClient().conn
			.selectFrom('url_metadata')
			.select('site')
			.where('url', '=', body.url)
			.executeTakeFirst();

		if (metadata) {
			return status(403, {
				error: {
					message: 'The URL requested has been already registered.',
				},
			});
		}

		let filename: string | null = null;
		let size: string | null = null;

		if (body.image) {
			const picture = await storeImage(body.image.data);

			if (!picture) {
				return status(400, {
					error: {
						message: 'Bad request.',
					},
				});
			}

			filename = picture.filename;
			size = `(${picture.size.x}, ${picture.size.y})`;
		}

		await getClient().conn
			.insertInto('url_metadata')
			.values({
				url: body.url,
				site: body.site,
				title: body.title ?? null,
				description: body.description ?? null,
				picture_filename: filename ?? null,
				picture_size: size ?? null,
				picture_alt: body.image ? body.image.alt : null,
				created_at: new Date(),
			})
			.execute();

		return {
			success: true,
		};
	}, {
		body: t.Object({
			url: t.String(),
			site: t.String(),
			title: t.Nullable(t.String()),
			description: t.Nullable(t.String()),
			image: t.Nullable(t.Object({
				data: t.String(),
				alt: t.Nullable(t.String()),
				size: t.Nullable(t.Object({
					x: t.Nullable(t.Number()),
					y: t.Nullable(t.Number()),
				})),
			})),
		}),
	})
	.delete('/', async ({ query, status }) =>
	{
		const metadata = await getClient().conn
			.selectFrom('url_metadata')
			.select('picture_filename')
			.where('url', '=', query.q)
			.executeTakeFirst();

		if (!metadata) {
			return status(401, {
				error: {
					message: 'Not Found',
				},
			});
		}

		if (metadata.picture_filename) {
			await deleteImage(metadata.picture_filename);
		}

		await getClient().conn
			.deleteFrom('url_metadata')
			.where('url', '=', query.q)
			.execute();
	}, {
		query: t.Object({
			q: t.String(),
		}),
	})
;

export default route;
