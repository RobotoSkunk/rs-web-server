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
	.post('/', async ({ body, status }) =>
	{
		if (body.picture && body.picture.length > fileLimitSize) {
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
			.execute();

		if (metadata) {
			return status(403, {
				error: {
					message: 'The URL requested has been already registered.',
				},
			});
		}

		let filename: string | null = null;
		let size: string | null = null;
		let site = 'generic';

		if (body.picture) {
			const picture = await storeImage(body.picture);

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

		switch (true) {
			case body.url.includes('youtube.com'):
				site = 'youtube';
				break;

			case body.url.includes('x.com'):
			case body.url.includes('twitter.com'):
				site = 'twitter';
				break;

			case body.url.includes('reddit.com'):
				site = 'reddit';
				break;

			case body.url.includes('wikipedia.com'):
				site = 'wikipedia';
				break;
		}

		await getClient().conn
			.insertInto('url_metadata')
			.values({
				url: body.url,
				site,
				title: body.title,
				description: body.description,
				picture_filename: filename,
				picture_size: size,
				created_at: new Date(),
			})
			.execute();

		return {
			success: true,
		};
	}, {
		body: t.Object({
			url: t.String(),
			title: t.Optional(t.String()),
			description: t.Optional(t.String()),
			picture: t.Optional(t.String()),
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
