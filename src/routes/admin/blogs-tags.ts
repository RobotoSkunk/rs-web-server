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


const route = new Elysia({ prefix: '/tags' })
	.get('/', async () =>
	{
		const tags = await getClient().conn
			.selectFrom('blog_tags')
			.select([
				'id',
				'comment',
			])
			.execute();

		const response: object[] = [];

		for (const tag of tags) {
			const langs = await getClient().conn
				.selectFrom('blog_tag_localizations')
				.select([
					'id',
					'lang',
					'content',
				])
				.where('tag_id', '=', tag.id!)
				.execute();

			response.push({
				...tags,
				languages: langs,
			});
		}

		return response;
	})
	.post('/', async ({ body, status }) =>
	{
		const tag = await getClient().conn
			.insertInto('blog_tags')
			.values({
				comment: body.comment,
			})
			.returning('id')
			.executeTakeFirstOrThrow();

		const langs: {
			lang: string;
			content: string;
			tag_id: number;
		}[] = [];

		for (const lang of body.languages) {
			langs.push({
				lang: lang.lang,
				content: lang.content,
				tag_id: tag.id!,
			});
		}

		await getClient().conn
			.insertInto('blog_tag_localizations')
			.values(langs)
			.execute();

		return {
			success: true,
		};
	}, {
		body: t.Object({
			comment: t.String(),
			languages: t.Array(t.Object({
				lang: t.String(),
				content: t.String(),
			})),
		}),
	})
	.patch('/:id', async ({ params, body, status }) =>
	{
		const tag = await getClient().conn
			.selectFrom('blog_tags')
			.select('id')
			.where('id', '=', params.id)
			.executeTakeFirstOrThrow();

		if (!tag) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await getClient().conn
			.updateTable('blog_tags')
			.set({
				comment: body.comment,
			})
			.where('id', '=', params.id)
			.execute();

		return {
			success: true,
		};
	}, {
		params: t.Object({
			id: t.Number(),
		}),
		body: t.Object({
			comment: t.String(),
		}),
	})
	.delete('/:id', async ({ params, status }) =>
	{
		const tag = await getClient().conn
			.selectFrom('blog_tags')
			.select('id')
			.where('id', '=', params.id)
			.executeTakeFirstOrThrow();

		if (!tag) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await getClient().conn
			.deleteFrom('blog_tags')
			.where('id', '=', params.id)
			.execute();

		return {
			success: true,
		};
	}, {
		params: t.Object({
			id: t.Number(),
		}),
	})
;

export default route;
