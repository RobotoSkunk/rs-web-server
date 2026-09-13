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
} from '../database/client';

import crypto from 'node:crypto';

import Admin from './admin';
import Encryptor from '../crypto/encryptor';
import Secrets from '../crypto/secrets';


export default class AuthToken
{
	private _id: string;
	private _admin: Admin;

	constructor(id: string, admin: Admin)
	{
		this._id = id;
		this._admin = admin;
	}

	public get id()
	{
		return this._id;
	}

	public get admin()
	{
		return this._admin;
	}


	public static async authenticate(token: string): Promise<AuthToken | null>
	{
		// Check token's structure
		const parts = token.split('.');

		if (parts.length != 2 || !parts[0]?.length || !parts[1]?.length) {
			return null;
		}

		const id = parts[0]!;
		const validator = parts[1]!;

		// Validate if the token ID exists
		const tokenData = await getClient().conn
			.selectFrom('auth_tokens')
			.select([
				'admin_id',
				'validator',
				'expires_at',
			])
			.where('id', '=', id)
			.executeTakeFirst();

		if (!tokenData) {
			return null;
		}

		// Check the expiration of the token
		if (tokenData.expires_at!.getTime() < Date.now()) {
			await getClient().conn
				.deleteFrom('auth_tokens')
				.where('id', '=', id)
				.execute();

			return null;
		}

		// Check the validator
		const salt = await Secrets.get('hmac_salt');
		const validatorBuffer = Buffer.from(validator!, 'base64url');

		const expected = Buffer.from(tokenData.validator!);
		const actual = Buffer.from(Encryptor.hmac(validatorBuffer, salt!));

		if (!crypto.timingSafeEqual(expected, actual)) {
			return null;
		}

		// Update the cookie expiration time
		await getClient().conn
			.updateTable('auth_tokens')
			.set({
				expires_at: new Date(Date.now() + 3_600_000), // 1 hour of inactivity
			})
			.where('id', '=', id)
			.execute();

		// Get the admin associated with the token
		const admin = await Admin.findById(tokenData.admin_id!);

		return new AuthToken(id, admin!);
	}

	public static async create(admin: Admin): Promise<string | null>
	{
		const id = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
		const validator = Buffer.from(crypto.getRandomValues(new Uint8Array(128)));

		const salt = await Secrets.get('hmac_salt');
		const hashedValidator = Encryptor.hmac(validator, salt!);

		await getClient().conn
			.insertInto('auth_tokens')
			.values({
				id,
				admin_id: admin.id,
				validator: hashedValidator,
			})
			.execute();

		const tokenParts: string[] = [
			id,
			validator.toString('base64url'),
		];

		return tokenParts.join('.');
	}

	public async delete(): Promise<void>
	{
		await getClient().conn
			.deleteFrom('auth_tokens')
			.where('id', '=', this._id)
			.execute();
	}
}
