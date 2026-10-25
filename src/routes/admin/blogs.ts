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
	updateImage,
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

		const contents = await getClient().conn
			.selectFrom('blog_contents')
			.select('id')
			.where('blog_id', '=', id)
			.execute();

		for (const content of contents) {
			const pictures = await getClient().conn
				.selectFrom('blog_content_pictures')
				.select([
					'picture_filename as filename',
					'picture_small_filename as small_filename',
				])
				.where('blog_content_id', '=', content.id!)
				.execute();

			for (const picture of pictures) {
				await deleteImage(picture.filename);
				await deleteImage(picture.small_filename);
			}
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

	// Blog contents
	.get('/:id/content/:lang', async ({ params: { id, lang }, status }) =>
	{
		const content = await getClient().conn
			.selectFrom('blog_contents')
			.select([
				'id',
				'lang',
				'title_draft as title',
				'description_draft as description',
				'content_draft as content',
				'thumbnail_filename',
				'thumbnail_size',
				'created_at',
				'updated_at',
				'hidden',
			])
			.where('blog_id', '=', id)
			.where('lang', '=', lang)
			.executeTakeFirst();

		if (!content) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		const pictures = await getClient().conn
			.selectFrom('blog_content_pictures')
			.select([
				'id',
				'picture_small_filename',
				'picture_small_size',
				'alt',
			])
			.where('blog_content_id', '=', content.id!)
			.execute();

		const { thumbnail_filename, thumbnail_size, ...restOfContents } = content;

		return {
			...restOfContents,
			thumbnail: {
				filename: thumbnail_filename,
				size: thumbnail_size,
			},
			pictures: pictures.map((v) =>
			({
				id: v.id,
				alt: v.alt,
				picture: {
					filename: v.picture_small_filename,
					size: v.picture_small_size,
				},
			})),
		};
	}, {
		params: t.Object({
			id: t.Number(),
			lang: t.String(),
		}),
	})
	.post('/:id/content/:lang', async ({ params: { id, lang }, status }) =>
	{
		const blog = await getClient().conn
			.selectFrom('blogs')
			.select('id')
			.where('id', '=', id)
			.executeTakeFirst();

		if (!blog) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		const content = await getClient().conn
			.insertInto('blog_contents')
			.values({
				lang,
				title: '',
				description: '',
				content: '',
				blog_id: id,
			})
			.returning('id')
			.executeTakeFirstOrThrow();

		return {
			success: true,
			id: content.id,
		};
	}, {
		params: t.Object({
			id: t.Number(),
			lang: t.String(),
		}),
	})
	.put('/content/:id', async ({ params: { id }, body, status }) =>
	{
		if (body.thumbnail.length > fileLimitSize || body.thumbnail.length > fileLimitSize) {
			return status(413, {
				error: {
					message: 'The maximum file size allowed is 10 MiB.',
				},
			});
		}

		const content = await getClient().conn
			.selectFrom('blog_contents')
			.select('thumbnail_filename')
			.where('id', '=', id)
			.executeTakeFirst();

		if (!content) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		if (content.thumbnail_filename) {
			const image = await updateImage(content.thumbnail_filename, body.thumbnail);

			if (!image) {
				return status(400, {
					error: {
						message: 'Bad request.',
					},
				});
			}

			await getClient().conn
				.updateTable('blog_contents')
				.set({
					thumbnail_size: `(${image.size.x}, ${image.size.y})`,
				})
				.where('id', '=', id)
				.executeTakeFirst();
		} else {
			const image = await storeImage(body.thumbnail);

			if (!image) {
				return status(400, {
					error: {
						message: 'Bad request.',
					},
				});
			}

			await getClient().conn
				.updateTable('blog_contents')
				.set({
					thumbnail_filename: image.filename,
					thumbnail_size: `(${image.size.x}, ${image.size.y})`,
				})
				.where('id', '=', id)
				.executeTakeFirstOrThrow();
		}

		return {
			success: true,
		};
	}, {
		params: t.Object({
			id: t.Number(),
		}),
		body: t.Object({
			thumbnail: t.String(),
		}),
	})
	.post('/content/:id/publish', async ({ params: { id }, status }) =>
	{
		const content = await getClient().conn
			.selectFrom('blog_contents')
			.select([
				'created_at',
				'updated_at',
				'title_draft',
				'description_draft',
				'content_draft',
			])
			.where('id', '=', id)
			.executeTakeFirst();

		if (!content) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await getClient().conn
			.updateTable('blog_contents')
			.set({
				title: content.title_draft!,
				description: content.description_draft!,
				content: content.content_draft!,

				// If created_at didn't exist, set it to the current date
				created_at: content.created_at ? undefined : new Date(),

				// If created_at exists, it means the post was updated after the first publish and needs a new date
				updated_at: content.created_at ? new Date() : undefined,
				hidden: false,
			})
			.where('id', '=', id)
			.executeTakeFirstOrThrow();

		return {
			success: true,
		};
	}, {
		params: t.Object({
			id: t.Number(),
		}),
	})
	.post('/content/:id/draft', async ({ params: { id }, body, status }) =>
	{
		const content = await getClient().conn
			.selectFrom('blog_contents')
			.select([
				'created_at',
				'updated_at',
			])
			.where('id', '=', id)
			.executeTakeFirst();

		if (!content) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await getClient().conn
			.updateTable('blog_contents')
			.set({
				title_draft: body.title,
				description_draft: body.description,
				content_draft: body.content,
			})
			.where('id', '=', id)
			.executeTakeFirstOrThrow();

		return {
			success: true,
		};
	}, {
		params: t.Object({
			id: t.Number(),
		}),
		body: t.Object({
			title: t.String(),
			description: t.String(),
			content: t.String(),
		}),
	})

	// Blog content pictures
	.post('/content/:id/picture', async ({ params: { id }, body, status }) =>
	{
		if (body.picture.length > fileLimitSize || body.picture_small.length > fileLimitSize) {
			return status(413, {
				error: {
					message: 'The maximum file size allowed is 10 MiB.',
				},
			});
		}

		const content = await getClient().conn
			.selectFrom('blog_contents')
			.select('id')
			.where('id', '=', id)
			.executeTakeFirst();

		if (!content) {
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

		const insertedPicture = await getClient().conn
			.insertInto('blog_content_pictures')
			.values({
				picture_filename: picture.filename,
				picture_small_filename: pictureSmall.filename,
				picture_size: `(${picture.size.x}, ${picture.size.y})`,
				picture_small_size: `(${pictureSmall.size.x}, ${pictureSmall.size.y})`,
				alt: body.alt,
				blog_content_id: id,
			})
			.returning('id')
			.executeTakeFirstOrThrow();

		return {
			success: true,
			id: insertedPicture.id,
			filename: pictureSmall.filename,
			size: pictureSmall.size,
		};
	}, {
		params: t.Object({
			id: t.Number(),
		}),
		body: t.Object({
			picture: t.String(),
			picture_small: t.String(),
			alt: t.String(),
		}),
	})
	.patch('/content/picture/:id', async ({ params: { id }, body, status }) =>
	{
		const picture = await getClient().conn
			.selectFrom('blog_content_pictures')
			.select('id')
			.where('id', '=', id)
			.executeTakeFirst();

		if (!picture) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await getClient().conn
			.updateTable('blog_content_pictures')
			.set({
				alt: body.alt,
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
			alt: t.String(),
		}),
	})
	.put('/content/picture/:id', async ({ params: { id }, body, status }) =>
	{
		if (body.picture.length > fileLimitSize || body.picture_small.length > fileLimitSize) {
			return status(413, {
				error: {
					message: 'The maximum file size allowed is 10 MiB.',
				},
			});
		}

		const picture = await getClient().conn
			.selectFrom('blog_content_pictures')
			.select([
				'picture_filename as filename',
				'picture_small_filename as small_filename',
			])
			.where('id', '=', id)
			.executeTakeFirst();

		if (!picture) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		const pictureData = await updateImage(picture.filename, body.picture);
		const pictureSmallData = await updateImage(picture.small_filename, body.picture_small);

		if (!pictureData || !pictureSmallData) {
			return status(400, {
				error: {
					message: 'Bad request.',
				},
			});
		}

		await getClient().conn
			.updateTable('blog_content_pictures')
			.set({
				picture_size: `(${pictureData.size.x}, ${pictureData.size.y})`,
				picture_small_size: `(${pictureSmallData.size.x}, ${pictureSmallData.size.y})`,
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
			picture: t.String(),
			picture_small: t.String(),
		}),
	})
	.delete('/content/picture/:id', async ({ params: { id }, status }) =>
	{
		const picture = await getClient().conn
			.selectFrom('blog_content_pictures')
			.select([
				'picture_filename',
				'picture_small_filename',
			])
			.where('id', '=', id)
			.executeTakeFirst();

		if (!picture) {
			return status(404, {
				error: {
					message: 'Not Found',
				},
			});
		}

		await getClient().conn
			.deleteFrom('blog_content_pictures')
			.where('id', '=', id)
			.execute();

		await deleteImage(picture.picture_filename);
		await deleteImage(picture.picture_small_filename);

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
