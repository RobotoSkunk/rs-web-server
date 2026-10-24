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

import tagsRouter from './blogs-tags';


const route = new Elysia({ prefix: '/blogs' })
	.use(tagsRouter)

	// Blogs
	.get('/', async () =>
	{
		const blogs = await getClient().conn
			.selectFrom('blogs')
			.select(({ selectFrom }) =>
			[
				'id',
				'comment',
				'hidden',

				selectFrom('blog_contents')
					.whereRef('blogs.id' , '=', 'blog_contents.blog_id')
					.select(({ fn }) => fn.jsonAgg('blog_contents.lang').as('lang'))
					.as('languages'),
			])
			.execute();

		return blogs.map((entry) =>
		({
			...entry,
			languages: entry.languages ?? [],
		}));
	})
	.get('/:id', async ({ params: { id }, status }) =>
	{
		const blog = await getClient().conn
			.selectFrom('blogs')
			.selectAll()
			.executeTakeFirst();

		if (!blog) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		const tags = await getClient().conn
			.selectFrom([ 'blog_tags', 'blog_tag_relationship' ])
			.select([
				'blog_tags.id as id',
				'blog_tags.comment as comment',
			])
			.whereRef('blog_tags.id', '=', 'blog_tag_relationship.tag_id')
			.where('blog_id', '=', id)
			.execute();

		return {
			...blog,
			tags,
		};
	}, {
		params: t.Object({
			id: t.Number(),
		}),
	})
	.post('/', async ({ body }) =>
	{
		const blog = await getClient().conn
			.insertInto('blogs')
			.values({
				comment: body.comment,
				hidden: true,
			})
			.returning('id')
			.executeTakeFirstOrThrow();

		return {
			success: true,
			id: blog.id,
		};
	}, {
		body: t.Object({
			comment: t.String(),
		}),
	})
	.patch('/:id', async ({ params: { id }, body, status }) =>
	{
		const blog = await getClient().conn
			.selectFrom('blogs')
			.select('id')
			.where('id', '=', id)
			.executeTakeFirstOrThrow();

		if (!blog) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await getClient().conn
			.updateTable('blogs')
			.set({
				comment: body.comment,
			})
			.returning('id')
			.executeTakeFirstOrThrow();

		return {
			success: true,
			id: blog.id,
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
		const blog = await getClient().conn
			.selectFrom('blogs')
			.select('id')
			.where('id', '=', id)
			.executeTakeFirstOrThrow();

		if (!blog) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await getClient().conn
			.deleteFrom('blogs')
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
