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

import pm2 from 'pm2';
import password from '@inquirer/password';

const passphrase = await password({
	message: 'SECRET_STORAGE_PASSPHRASE: ',
	mask: false,
	toggleMask: false,
});

if (!passphrase) {
	console.error('The secret storage cannot be loaded without a passphrase.');
	process.exit(1);
}

pm2.connect((error) =>
{
	if (error) {
		console.error(error);
		process.exit(-1);
	}

	pm2.start({
		script:      'src/wrapper.js',
		name:        'rs-web-server',
		interpreter: 'bun',
		cwd:          process.cwd(),
		env: {
			SECRET_STORAGE_PASSPHRASE: passphrase,
		},
	}, (error, proc) =>
	{
		if (error) {
			console.error(error);
			pm2.disconnect();
			return;
		}

		console.log(`Process ${proc.name} (${proc.pm_id}) started.`);
		pm2.disconnect();
		process.exit(0);
	});
});
