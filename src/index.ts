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
	dbClient,
} from './database/client';

import {
	serverTiming,
} from '@elysia/server-timing';

import Elysia from 'elysia';

import workers from './workers';
import adminRouter from './routes/admin';
import Secrets from './crypto/secrets';


// Verify if the required environment variables are present.
const requiredEnvVariables = [
	'PORT',
	'ADMIN_PORT',
	'DB_NAME',
	'DB_HOST',
	'DB_PASSWORD',
	'DB_PORT',
	'DB_USER',
	'SECRET_STORAGE_DIRECTORY',
];

const missingEnvVariables: string[] = [];

for (const variable of requiredEnvVariables) {
	if (!process.env[variable]) {
		missingEnvVariables.push(variable);
	}
}

if (missingEnvVariables.length > 0) {
	console.error(`Missing environment variables: ${missingEnvVariables.join(', ')}`);
	process.exit(1);
}


// Set up the server's secrets
try {
	await Secrets.loadSecrets();
} catch (e) {
	console.error('Fatal error when trying to initialize the secret storage');
	console.error(e);

	process.exit(-1);
}


// Try to migrate the database
try {
	await dbClient.tryMigrateToLatest();
} catch (e) {
	console.error('Fatal error when trying to migrate database.');
	console.error(e);

	process.exit(-2);
}

// Execute workers
workers();

// Start admin and public API
new Elysia()
	.use(serverTiming())
	.use(adminRouter)
	.listen(process.env.ADMIN_PORT!);

console.log(`Admin API listening on port ${process.env.ADMIN_PORT}`);
