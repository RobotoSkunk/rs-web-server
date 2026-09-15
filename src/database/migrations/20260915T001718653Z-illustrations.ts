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
	// CREATE TABLE illustrations
	await db.schema
		.createTable('illustrations')
		.addColumn('id', 'uuid', c => c.primaryKey().defaultTo(sql`GEN_RANDOM_UUID()`))
		.addColumn('picture_filename', 'text', c => c.notNull())
		.addColumn('picture_small_filename', 'text', c => c.notNull())
		.addColumn('uploaded_at', 'timestamp', c => c.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
		.addColumn('created_at', 'date', c => c.notNull())
		.execute();

	// CREATE TABLE illustration_alts
	await db.schema
		.createTable('illustration_alts')
		.addColumn('id', 'uuid', c => c.primaryKey().defaultTo(sql`GEN_RANDOM_UUID()`))
		.addColumn('illustration_id', 'uuid', c => c.notNull())
		.addColumn('lang', 'text', c => c.notNull())
		.addColumn('content', 'text', c => c.notNull())
		.addColumn('description', 'text', c => c.notNull())

		.addForeignKeyConstraint('fk_illustration_alts_illustration_id', [ 'illustration_id' ], 'illustrations', [ 'id' ])
		.execute();

	// CREATE INDEX
	await db.schema
		.createIndex('ind_illustrations_uploaded_at')
		.on('illustrations')
		.column('uploaded_at')
		.execute();
}

async function down(db: Kysely<unknown>): Promise<void>
{
	await db.schema
		.dropTable('illustration_alts')
		.execute();

	await db.schema
		.dropTable('illustrations')
		.execute();
}

export {
	up,
	down,
};
