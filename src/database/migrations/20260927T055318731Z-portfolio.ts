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
	// CREATE TABLE projects
	await db.schema
		.createTable('projects')
		.addColumn('id', 'uuid', c => c.primaryKey().defaultTo(sql`GEN_RANDOM_UUID()`))
		.addColumn('icon_filename', 'text', c => c.notNull())
		.addColumn('icon_size', sql`POINT`, c => c.notNull())
		.addColumn('position', 'smallint', c => c.notNull())
		.addColumn('hidden', 'boolean', c => c.notNull().defaultTo(true))
		.execute();

	// CREATE INDEX ind_projects_position
	await db.schema
		.createIndex('ind_projects_position')
		.on('projects')
		.column('position')
		.execute();

	// CREATE TABLE project_contents
	await db.schema
		.createTable('project_contents')
		.addColumn('id', 'uuid', c => c.primaryKey().defaultTo(sql`GEN_RANDOM_UUID()`))
		.addColumn('lang', 'text', c => c.notNull())
		.addColumn('name', 'text', c => c.notNull())
		.addColumn('description', 'text', c => c.notNull())
		.addColumn('project_id', 'uuid', c => c.notNull())

		.addForeignKeyConstraint(
			'fk_project_contents_project_id',
			[ 'project_id' ],
			'projects',
			[ 'id' ],
			b => b.onDelete('cascade')
		)
		.execute();

	// CREATE TABLE project_pictures
	await db.schema
		.createTable('project_pictures')
		.addColumn('id', 'uuid', c => c.primaryKey().defaultTo(sql`GEN_RANDOM_UUID()`))
		.addColumn('position', 'smallint', c => c.notNull())
		.addColumn('picture_filename', 'text', c => c.notNull())
		.addColumn('picture_size', sql`POINT`, c => c.notNull())
		.addColumn('picture_small_filename', 'text', c => c.notNull())
		.addColumn('picture_small_size', sql`POINT`, c => c.notNull())
		.addColumn('project_id', 'uuid', c => c.notNull())

		.addForeignKeyConstraint(
			'fk_project_pictures_project_id', [ 'project_id' ],
			'projects', [ 'id' ],
			b => b.onDelete('cascade')
		)
		.execute();

	// CREATE INDEX ind_project_pictures_position
	await db.schema
		.createIndex('ind_project_pictures_position')
		.on('project_pictures')
		.column('position')
		.execute();

	// CREATE TABLE project_picture_alts
	await db.schema
		.createTable('project_picture_alts')
		.addColumn('id', 'uuid', c => c.primaryKey().defaultTo(sql`GEN_RANDOM_UUID()`))
		.addColumn('lang', 'text', c => c.notNull())
		.addColumn('content', 'text', c => c.notNull())
		.addColumn('project_picture_id', 'uuid', c => c.notNull())

		.addForeignKeyConstraint(
			'fk_project_picture_alts_picture_id', [ 'project_picture_id' ],
			'project_pictures', [ 'id' ],
			b => b.onDelete('cascade')
		)
		.execute();
}

async function down(db: Kysely<unknown>): Promise<void>
{
	await db.schema
		.dropTable('project_picture_alts')
		.execute();

	await db.schema
		.dropTable('project_pictures')
		.execute();

	await db.schema
		.dropTable('project_contents')
		.execute();

		await db.schema
		.dropTable('projects')
		.execute();
}

export {
	up,
	down,
};
