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
} from 'kysely';


async function up(db: Kysely<unknown>): Promise<void>
{
	await db.schema
		.alterTable('blog_contents')
		.addColumn('title_draft', 'text', cb => cb.notNull().defaultTo(''))
		.addColumn('description_draft', 'text', cb => cb.notNull().defaultTo(''))
		.addColumn('content_draft', 'text', cb => cb.notNull().defaultTo(''))
		.execute();
}

async function down(db: Kysely<unknown>): Promise<void>
{
	await db.schema
		.alterTable('blog_contents')
		.dropColumn('title_draft')
		.execute();

	await db.schema
		.alterTable('blog_contents')
		.dropColumn('description_draft')
		.execute();

	await db.schema
		.alterTable('blog_contents')
		.dropColumn('content_draft')
		.execute();
}

export {
	up,
	down,
};
