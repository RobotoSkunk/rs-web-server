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
	// ALTER TABLE admins
	await db.schema
		.alterTable('admins')
		.addColumn('salt', 'text', c => c.notNull())
		.addColumn('created_at', 'timestamp', c => c.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
		.execute();

	// CREATE INDEX ind_admins_username
	await db.schema
		.createIndex('ind_admins_username')
		.on('admins')
		.column('username')
		.execute();
}

async function down(db: Kysely<unknown>): Promise<void>
{
	await db.schema
		.alterTable('admins')
		.dropColumn('created_at')
		.execute();

	await db.schema
		.alterTable('admins')
		.dropColumn('salt')
		.execute();

	await db.schema
		.dropIndex('ind_admins_username')
		.execute();
}

export {
	up,
	down,
};
