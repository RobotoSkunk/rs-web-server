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
	join,
} from 'node:path';

const template = `/**
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
	// Migration code
}

async function down(db: Kysely<unknown>): Promise<void>
{
	// Migration code
}

export {
	up,
	down,
};
`;

const name = process.argv[2];

if (!name || !name.match(/^[a-z0-9-]+$/)) {
	console.error('Must pass a migration name with just lowercase digits, numbers and dashes.');
	process.exit(1);
}

const rootPath = join(process.cwd(), 'src', 'database', 'migrations');
const isoDate = new Date().toISOString().replace(/[^a-z0-9]/gi, '');
const filename = `${isoDate}-${name}.ts`;

const indexFile = Bun.file(join(rootPath, 'index.ts'));
const migrationFile = Bun.file(join(rootPath, filename));

await indexFile.write(
	await indexFile.text() +
	`export * as _${isoDate} from './${filename}';\n`
);

await migrationFile.write(template);
