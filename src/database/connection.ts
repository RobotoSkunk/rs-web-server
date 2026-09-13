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
	Pool,
} from 'pg';

import {
	Kysely,
	PostgresDialect,
} from 'kysely';

import {
	Migrator,
} from 'kysely/migration';

import type {
	DatabaseSchemaType,
	DatabaseSchema,
} from './schema';

import {
	ContextMigrationProvider,
} from './migrations/provider';

import * as migrations from './migrations';


class Database
{
	/**
	 * Database connection pool
	 */
	private pool: Pool;

	/**
	 * Kysely connection
	 */
	private db: DatabaseSchema;

	/**
	 * Kysely migrator
	 */
	private migrator: Migrator;


	/**
	 * Create a new database connection pool based on environment variables
	 */
	constructor(user: string, password: string)
	{
		this.pool = new Pool({
			database: process.env.DB_NAME,
			host: process.env.DB_HOST,
			port: Number.parseInt(process.env.DB_PORT ?? '5432'),
			user,
			password,
		});

		const dialect = new PostgresDialect({ pool: this.pool });
		this.db = new Kysely<DatabaseSchemaType>({ dialect });

		this.migrator = new Migrator({
			db: this.db,
			provider: new ContextMigrationProvider(migrations, 'pg')
		})
	}

	/**
	 * Just a wrapper of migrateTo but with try/catch compatibility.
	 */
	public async tryMigrateTo(migration: string)
	{
		const { error, results } = await this.migrator.migrateTo(migration);
		
		if (error) {
			throw error;
		}

		if (!results) {
			throw new Error('An unknown error ocurred while migrating.');
		}

		return results;
	}


	/**
	 * Just a wrapper of migrateToLatest but with try/catch compatibility.
	 */
	public async tryMigrateToLatest()
	{
		const { error, results } = await this.migrator.migrateToLatest();
		
		if (error) {
			throw error;
		}

		if (!results) {
			throw new Error('An unknown error ocurred while migrating.');
		}

		return results;
	}

	public get conn()
	{
		return this.db;
	}
}


export default Database;
