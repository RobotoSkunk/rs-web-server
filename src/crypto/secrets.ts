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
	secrets,
} from 'bun';


type keyNames = 'crypto.bogus_salt' | 'crypto.encryption_key' | 'crypto.hmac_key';

export default class Secrets
{
	private static readonly service = 'com.robotoskunk.admin';

	public static async set(name: keyNames, value: string)
	{
		await secrets.set({
			service: this.service,
			name,
			value,
		});
	}

	public static async get(name: keyNames)
	{
		return await secrets.get({
			service: this.service,
			name,
		});
	}

	public static async delete(name: keyNames)
	{
		return await secrets.delete({
			service: this.service,
			name,
		});
	}
}
