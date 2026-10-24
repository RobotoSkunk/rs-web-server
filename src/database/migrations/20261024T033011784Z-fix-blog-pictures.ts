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


async function up(db: Kysely<unknown>): Promise<void>
{
	await db.schema
		.alterTable('blog_content_pictures')
		.addColumn('picture_small_filename', 'text', cb => cb.notNull())
		.execute();

	await db.schema
		.alterTable('blog_content_pictures')
		.addColumn('picture_small_size', sql`point`, cb => cb.notNull())
		.execute();
}

async function down(db: Kysely<unknown>): Promise<void>
{
	await db.schema
		.alterTable('blog_content_pictures')
		.dropColumn('picture_small_filename')
		.execute();

	await db.schema
		.alterTable('blog_content_pictures')
		.dropColumn('picture_small_size')
		.execute();
}

export {
	up,
	down,
};
