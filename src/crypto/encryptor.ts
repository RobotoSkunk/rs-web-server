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

import type {
	KeyLike,
} from 'node:crypto';

import Secrets from '../crypto/secrets';

import crypto from 'node:crypto';


export default class Encryptor
{
	private static readonly encryptionAlgorithm = 'aes-256-gcm';

	public static hmac(data: string | NodeJS.ArrayBufferView<ArrayBufferLike>, key: KeyLike): string
	{
		const hmacEntity = crypto.createHmac('sha256', key);
		hmacEntity.update(data);

		return hmacEntity.digest('hex');
	}

	public static async getEncryptionKey()
	{
		const rawKey = (await Secrets.get('crypto.encryption_key'))!;
		return rawKey;
	}

	public static async encrypt(data: string | Buffer<ArrayBuffer>, key?: Buffer<ArrayBuffer>)
	{
		const cryptoKey = key ?? await this.getEncryptionKey();
		const iv = crypto.getRandomValues(new Uint8Array(12));

		const cipher = crypto.createCipheriv(this.encryptionAlgorithm, cryptoKey, iv);

		const cipherText = Buffer.concat([
			cipher.update(data),
			cipher.final(),
		]);

		const authTag = cipher.getAuthTag();

		return Buffer.concat([ iv, cipherText, authTag ]);
	}

	public static async decrypt(data: Buffer, key?: Buffer<ArrayBuffer>)
	{
		const cryptoKey = key ?? await this.getEncryptionKey();

		const iv = data.subarray(0, 12);
		const authTag = data.subarray(data.length - 16);
		const cipherText = data.subarray(12, data.length - 16);

		const decipher = crypto.createDecipheriv(this.encryptionAlgorithm, cryptoKey, iv);
		decipher.setAuthTag(authTag);

		const plainText = Buffer.concat([
			decipher.update(cipherText),
			decipher.final(),
		]);

		return plainText;
	}
}
