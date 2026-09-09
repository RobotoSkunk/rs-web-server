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
	// CREATE TABLE admins
	await db.schema
		.createTable('admins')
		.addColumn('id', 'uuid', c => c.primaryKey().defaultTo(sql`GEN_RANDOM_UUID()`))
		.addColumn('username', 'text', c => c.notNull())
		.addColumn('password_salt', 'text', c => c.notNull())
		.addColumn('password_verifier', 'text', c => c.notNull())
		.addColumn('totp_key', 'text', c => c.notNull())
		.execute();

	// CREATE TABLE audit_logs
	await db.schema
		.createTable('audit_logs')
		.addColumn('id', 'uuid', c => c.primaryKey().defaultTo(sql`GEN_RANDOM_UUID()`))
		.addColumn('content', 'text', c => c.notNull())
		.addColumn('admin_id', 'uuid', c => c.notNull())
		.addColumn('created_at', 'timestamp', c => c.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))

		.addForeignKeyConstraint('fk_audit_logs_actor', [ 'admin_id' ], 'admins', [ 'id' ])

		.execute();

	// CREATE TABLE auth_tokens
	await db.schema
		.createTable('auth_tokens')
		.addColumn('id', 'text', c => c.primaryKey())
		.addColumn('validator', 'text', c => c.notNull())
		.addColumn('admin_id', 'uuid', c => c.notNull())
		.addColumn('created_at', 'timestamp', c => c.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
		.addColumn('expires_at', 'timestamp', c => c.notNull().defaultTo(sql`CURRENT_TIMESTAMP + '1 hour'`))

		.addForeignKeyConstraint('fk_auth_tokens_actor', [ 'admin_id' ], 'admins', [ 'id' ])

		.execute();
}

async function down(db: Kysely<unknown>): Promise<void>
{
	await db.schema.dropTable('admins').execute();
	await db.schema.dropTable('audit_logs').execute();
	await db.schema.dropTable('auth_tokens').execute();
}

export {
	up,
	down,
};
