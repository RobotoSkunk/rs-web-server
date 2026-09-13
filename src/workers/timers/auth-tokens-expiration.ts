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
	sql,
} from 'kysely';

import {
	getClient,
} from '../../database/client';


export default async () =>
{
	try {
		await getClient().conn
			.deleteFrom('auth_tokens')
			.where('expires_at', '<', sql<Date>`CURRENT_TIMESTAMP`)
			.execute();
	} catch (e) {
		console.log(new Date());
		console.error(e);
	}
};
