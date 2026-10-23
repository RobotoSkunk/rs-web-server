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
	Kysely,
	sql,
} from 'kysely';

/*
  To be fair, when I started the development of this database, I used UUIDs on everything by inertia instead of
  thinking if it really matters for this personal website, which is managed by one single person and don't manage
  massive amounts of data, so for the blogging system I'm using integers instead.
*/

async function up(db: Kysely<unknown>): Promise<void>
{
	// CREATE TABLE blogs
	await db.schema
		.createTable('blogs')
		.addColumn('id', 'serial', cb => cb.primaryKey())
		.addColumn('comment', 'text', cb => cb.notNull())
		.addColumn('hidden', 'boolean', cb => cb.defaultTo(true))
		.execute();

	// CREATE TABLE blog_contents
	await db.schema
		.createTable('blog_contents')
		.addColumn('id', 'serial', cb => cb.primaryKey())
		.addColumn('blog_id', 'integer', cb => cb.notNull())
		.addColumn('lang', 'text', cb => cb.notNull())
		.addColumn('title', 'text', cb => cb.notNull())
		.addColumn('description', 'text', cb => cb.notNull())
		.addColumn('content', 'text', cb => cb.notNull())
		.addColumn('thumbnail_filename', 'text', cb => cb.notNull())
		.addColumn('thumbnail_size', sql`point`, cb => cb.notNull())
		.addColumn('created_at', 'timestamp', cb => cb.notNull())
		.addColumn('updated_at', 'timestamp')
		.addColumn('hidden', 'boolean', cb => cb.defaultTo(true))

		.addForeignKeyConstraint('fk_blog_contents_blog_id', [ 'blog_id' ], 'blogs', [ 'id' ], fb => fb.onDelete('cascade'))
		.execute();

	// CREATE TABLE blog_content_pictures
	await db.schema
		.createTable('blog_content_pictures')
		.addColumn('id', 'bigserial', cb => cb.primaryKey())
		.addColumn('blog_content_id', 'integer', cb => cb.notNull())
		.addColumn('picture_filename', 'text', cb => cb.notNull())
		.addColumn('picture_size', sql`point`, cb => cb.notNull())
		.addColumn('alt', 'text', cb => cb.notNull())

		.addForeignKeyConstraint('fk_blog_pictures_blog_content_id', [ 'blog_content_id' ], 'blog_contents', [ 'id' ], fb => fb.onDelete('cascade'))
		.execute();

	// CREATE TABLE blog_tags
	await db.schema
		.createTable('blog_tags')
		.addColumn('id', 'serial', cb => cb.primaryKey())
		.addColumn('comment', 'text', cb => cb.notNull())
		.execute();

	// CREATE TABLE blog_tag_localizations
	await db.schema
		.createTable('blog_tag_localizations')
		.addColumn('id', 'serial', cb => cb.primaryKey())
		.addColumn('tag_id', 'integer', cb => cb.notNull())
		.addColumn('lang', 'text', cb => cb.notNull())
		.addColumn('content', 'text', cb => cb.notNull())

		.addForeignKeyConstraint('fk_tag_relation_tag_id', [ 'tag_id' ], 'blog_tags', [ 'id' ], fb => fb.onDelete('cascade'))
		.execute();

	// CREATE TABLE blog_tag_relationship
	await db.schema
		.createTable('blog_tag_relationship')
		.addColumn('blog_id', 'integer', cb => cb.notNull())
		.addColumn('tag_id', 'integer', cb => cb.notNull())

		.addPrimaryKeyConstraint('pk_blog_tag', [ 'blog_id', 'tag_id' ])
		.addForeignKeyConstraint('fk_tag_relation_blog_id', [ 'blog_id' ], 'blogs', [ 'id' ], fb => fb.onDelete('cascade'))
		.addForeignKeyConstraint('fk_tag_relation_tag_id', [ 'tag_id' ], 'blog_tags', [ 'id' ], fb => fb.onDelete('cascade'))
		.execute();

	// CREATE TABLE url_metadata
	await db.schema
		.createTable('url_metadata')
		.addColumn('url', 'text', cb => cb.primaryKey())
		.addColumn('site', 'text', cb => cb.notNull())
		.addColumn('title', 'text')
		.addColumn('description', 'text')
		.addColumn('picture_filename', 'text')
		.addColumn('picture_size', sql`point`)
		.addColumn('created_at', 'timestamp', cb => cb.notNull())
		.execute();
}

async function down(db: Kysely<unknown>): Promise<void>
{
	await db.schema
		.dropTable('blog_tag_relationship')
		.execute();

	await db.schema
		.dropTable('blog_tag_localizations')
		.execute();

	await db.schema
		.dropTable('blog_tags')
		.execute();

	await db.schema
		.dropTable('blog_content_pictures')
		.execute();

	await db.schema
		.dropTable('blog_contents')
		.execute();

	await db.schema
		.dropTable('blogs')
		.execute();

	await db.schema
		.dropTable('url_metadata')
		.execute();
}

export {
	up,
	down,
};
