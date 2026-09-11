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

import {
	timingSafeEqual,
} from 'node:crypto';

import Admin from './admin';
import Encryptor from '../crypto/encryptor';

import SRP from 'secure-remote-password/server';
import Secrets from '../crypto/secrets';

export default class AuthFlow
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

	public static async challenge(admin: Admin, clientEphemeral: string): Promise<{
		id: string;
		ephemeral: string;
		salt: string;
	}>
	{
		const srpValues = await admin.getSRPValues();
		const ephemeral = SRP.generateEphemeral(srpValues.verifier);

		const authFlow = await dbClient.conn
			.insertInto('auth_flow')
			.values({
				admin_id: admin.id,
				server_ephemeral_secret: ephemeral.secret,
				client_ephemeral_public: clientEphemeral,
			})
			.returning('id')
			.executeTakeFirst();

		return {
			id: authFlow!.id!,
			ephemeral: ephemeral.public,
			salt: srpValues.salt,
		};
	}

	public static async findAuthFlow(id: string): Promise<AuthFlow | null>
	{
		const authFlow = await dbClient.conn
			.selectFrom('auth_flow')
			.select('admin_id')
			.where('id', '=', id)
			.executeTakeFirst();

		if (!authFlow) {
			return null;
		}

		const admin = await Admin.findById(authFlow.admin_id!);
		return new AuthFlow(id, admin!);
	}

	public async verify(clientProof: string): Promise<{ proof: string; verifier: string } | null>
	{
		const srpValues = await this.admin.getSRPValues();
		const ephemerals = (await dbClient.conn
			.selectFrom('auth_flow')
			.select([
				'server_ephemeral_secret',
				'client_ephemeral_public',
			])
			.where('id', '=', this._id)
			.executeTakeFirst())!;

		let proof = '';

		try {
			const session = SRP.deriveSession(
				ephemerals.server_ephemeral_secret!,
				ephemerals.client_ephemeral_public!,
				srpValues.salt,
				this.admin.id,
				srpValues.verifier,
				clientProof
			);

			proof = session.proof;
		} catch (e) {
			console.error(e);
			return null;
		}

		const verifier = crypto.getRandomValues(new Uint8Array(32));
		const hmacKey = await Secrets.get('crypto.hmac_key');

		await dbClient.conn
			.updateTable('auth_flow')
			.set({
				verifier: Encryptor.hmac(verifier, hmacKey!),
				expires_at: new Date(Date.now() + 60_000 * 5),
			})
			.where('id', '=', this._id)
			.execute();

		return {
			proof,
			verifier: verifier.toBase64(),
		};
	}

	public async validateVerifier(rawVerifier: string): Promise<boolean>
	{
		const { verifier } = (await dbClient.conn
			.selectFrom('auth_flow')
			.select([
				'verifier',
			])
			.where('id', '=', this._id)
			.executeTakeFirst())!;

		if (!verifier) {
			return false;
		}

		const rawVerifierBuffer = Buffer.from(rawVerifier, 'base64');

		const hmacKey = await Secrets.get('crypto.hmac_key');
		const hmac = Encryptor.hmac(rawVerifierBuffer, hmacKey!);

		let equals = timingSafeEqual(
			Buffer.from(verifier),
			Buffer.from(hmac)
		);

		return equals;
	}

	public async delete(): Promise<void>
	{
		await dbClient.conn
			.deleteFrom('auth_flow')
			.where('id', '=', this._id)
			.execute();
	}
}
