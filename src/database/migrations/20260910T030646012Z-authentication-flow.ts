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
	// CREATE TABLE auth_flow
	await db.schema
		.createTable('auth_flow')
		.addColumn('id', 'uuid', c => c.primaryKey().defaultTo(sql`GEN_RANDOM_UUID()`))
		.addColumn('admin_id', 'uuid', c => c.notNull())
		.addColumn('client_ephemeral_public', 'text')
		.addColumn('server_ephemeral_public', 'text')
		.addColumn('server_ephemeral_secret', 'text')
		.addColumn('verifier', 'text')
		.addColumn('expires_at', 'timestamp', c => c.notNull().defaultTo(sql`CURRENT_TIMESTAMP + '1 minute'`))

		.addForeignKeyConstraint('fk_auth_flow_admin_id', [ 'admin_id' ], 'admins', [ 'id' ])

		.execute();
}

async function down(db: Kysely<unknown>): Promise<void>
{
	await db.schema
		.dropTable('auth_flow')
		.execute();
}

export {
	up,
	down,
};
