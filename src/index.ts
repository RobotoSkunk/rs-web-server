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
	getClient,
	setClient,
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
	'DB_PORT',
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
	const user = await Secrets.get('db.user');
	const password = await Secrets.get('db.password');

	setClient(user!.toString(), password!.toString());

	await getClient().tryMigrateToLatest();
} catch (e) {
	console.error('Fatal error when trying to migrate database.');
	console.error(e);

	process.exit(-2);
}

// Execute workers
workers();

// Start admin and public API
new Elysia()
	.onError(({ status, code, path, error }) =>
	{
		switch (code) {
			case 'INTERNAL_SERVER_ERROR': {
				console.error(path, '\n', error);
				break;
			}
			case 'NOT_FOUND':
			case 'VALIDATION': {
				if (code === 'VALIDATION' && process.env.NODE_ENV !== 'production') {
					console.log(error.detail(error.message));
				}

				return status(400, {
					error: {
						message: `Bad request.`,
					},
				});
			}
			case 401:
			case 403: {
				return status(code, {
					error: {
						message: `Unauthorized.`,
					},
				});
			}
		}

		return {
			error: {
				message: `Something went wrong.`,
			},
		};
	})
	.use(serverTiming())
	.use(adminRouter)
	.listen(process.env.ADMIN_PORT!);

console.log(`[${new Date().toISOString()}] Admin API listening on port ${process.env.ADMIN_PORT}.`);
