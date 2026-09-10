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
} from '../database/client';

import Encryptor from '../crypto/encryptor';

import * as OTPLib from 'otplib';


export default class Admin
{
	private _id: string;
	private _username: string;

	constructor(id: string, username: string)
	{
		this._id = id;
		this._username = username;
	}

	public get id()
	{
		return this._id;
	}

	public get username()
	{
		return this._username;
	}


	public static async findByUsername(username: string): Promise<Admin | null>
	{
		const adminData = await dbClient.conn
			.selectFrom('admins')
			.select('id')
			.where('username', '=', username)
			.executeTakeFirst();

		if (!adminData) {
			return null;
		}

		return new Admin(adminData.id!, username);
	}

	public static async findById(id: string): Promise<Admin | null>
	{
		const adminData = await dbClient.conn
			.selectFrom('admins')
			.select('username')
			.where('id', '=', id)
			.executeTakeFirst();

		if (!adminData) {
			return null;
		}

		return new Admin(id!, adminData.username!);
	}

	public static async register(
		userId: string,
		username: string,
		passwordSalt: string,
		passwordVerifier: string
	): Promise<string | null>
	{
		const totpSecret = OTPLib.generateSecret();
		const encryptedTotpKey = await Encryptor.encrypt(totpSecret);

		try {
			const result = await dbClient.conn
				.insertInto('admins')
				.values({
					id: userId,
					username,
					password_salt: passwordSalt,
					password_verifier: passwordVerifier,
					totp_key: encryptedTotpKey.toBase64(),
				})
				.executeTakeFirst();

			if (!result.numInsertedOrUpdatedRows) {
				return null;
			}
		} catch (e) {
			throw e;
		}

		return totpSecret;
	}

	public async getSRPValues()
	{
		const { password_salt, password_verifier } = (await dbClient.conn
			.selectFrom('admins')
			.select([
				'password_salt',
				'password_verifier',
			])
			.where('id', '=', this._id)
			.executeTakeFirst())!;

		return {
			salt: password_salt!,
			verifier: password_verifier!,
		};
	}

	public async validateTotp(totpToken: string)
	{
		const { totp_key } = (await dbClient.conn
			.selectFrom('admins')
			.select([
				'totp_key'
			])
			.where('id', '=', this._id)
			.executeTakeFirst())!;

		const totpKeyBuffer = Buffer.from(totp_key!, 'base64');
		const totpSecret = await Encryptor.decrypt(totpKeyBuffer);

		return OTPLib.verify({
			secret: totpSecret.toString(),
			token: totpToken,
		});
	}
}
