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
	.post('/', async ({ body }) =>
	{
		const tag = await getClient().conn
			.insertInto('blog_tags')
			.values({
				comment: body.comment,
			})
			.returningAll()
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

		const insertedLangs = await getClient().conn
			.insertInto('blog_tag_localizations')
			.values(langs)
			.returning([
				'id',
				'lang',
				'content',
			])
			.execute();

		return {
			success: true,
			tag: {
				...tag,
				languages: insertedLangs,
			}
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
	.patch('/:id', async ({ params: { id }, body, status }) =>
	{
		const tag = await getClient().conn
			.selectFrom('blog_tags')
			.select('id')
			.where('id', '=', id)
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
			.where('id', '=', id)
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
	.delete('/:id', async ({ params: { id }, status }) =>
	{
		const tag = await getClient().conn
			.selectFrom('blog_tags')
			.select('id')
			.where('id', '=', id)
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
			.where('id', '=', id)
			.execute();

		return {
			success: true,
		};
	}, {
		params: t.Object({
			id: t.Number(),
		}),
	})

	.post('/:id/lang', async ({ params: { id }, body, status }) =>
	{
		const tag = await getClient().conn
			.selectFrom('blog_tags')
			.select('id')
			.where('id', '=', id)
			.executeTakeFirstOrThrow();

		if (!tag) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		const locale = await getClient().conn
			.insertInto('blog_tag_localizations')
			.values({
				lang: body.lang,
				content: body.content,
				tag_id: id,
			})
			.returning('id')
			.executeTakeFirstOrThrow();

		return {
			success: true,
			id: locale.id,
		};
	}, {
		params: t.Object({
			id: t.Number(),
		}),
		body: t.Object({
			lang: t.String(),
			content: t.String(),
		}),
	})
	.patch('/lang/:id', async ({ params: { id }, body, status }) =>
	{
		const tag = await getClient().conn
			.selectFrom('blog_tag_localizations')
			.select('id')
			.where('id', '=', id)
			.executeTakeFirstOrThrow();

		if (!tag) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await getClient().conn
			.updateTable('blog_tag_localizations')
			.set({
				lang: body.lang,
				content: body.content,
			})
			.where('id', '=', id)
			.execute();

		return {
			success: true,
		};
	}, {
		params: t.Object({
			id: t.Number(),
		}),
		body: t.Partial(t.Object({
			lang: t.String(),
			content: t.String(),
		})),
	})
	.delete('/lang/:id', async ({ params: { id }, status }) =>
	{
		const tag = await getClient().conn
			.selectFrom('blog_tag_localizations')
			.select('id')
			.where('id', '=', id)
			.executeTakeFirstOrThrow();

		if (!tag) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await getClient().conn
			.deleteFrom('blog_tag_localizations')
			.where('id', '=', id)
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
