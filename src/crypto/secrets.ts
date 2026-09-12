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

import Encryptor from './encryptor';

import passwordPrompt from '@inquirer/password';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';


type InternalKeyNames = 'core.dek' | 'core.salt' | 'bogus_salt' | 'encryption_key' | 'hmac_salt';
type KeyNames = Exclude<InternalKeyNames, 'core.dek' | 'core.salt'>;

type SecretStorage = { [key in InternalKeyNames]: string };
type SecretCache = { [key: string]: Buffer };


export default class Secrets
{
	private static initalized = false;
	private static cache: SecretCache = { };
	private static directory = process.env.SECRET_STORAGE_DIRECTORY!;

	static async #getStoragePath(): Promise<string>
	{
		const directoryExists = await fs.exists(this.directory);
		if (!directoryExists) {
			throw new Error('The specified directory does not exist.');
		}

		const dir = await fs.stat(this.directory);
		if (!dir.isDirectory()) {
			throw new Error('The specified secret storage path is not a directory.');
		}

		return path.join(this.directory, 'secrets');
	}

	static async #readStorageObject(): Promise<SecretStorage>
	{
		const path = await this.#getStoragePath();

		const file = Bun.file(path);
		const exists = await file.exists();

		if (!exists) {
			// @ts-ignore cry about it
			return { };
		}

		return await file.json() as SecretStorage;
	}

	static async #writeStorageObject(data: SecretStorage): Promise<void>
	{
		const path = await this.#getStoragePath();

		const file = Bun.file(path);
		await file.write(JSON.stringify(data, null, 2));
	}

	static async #deriveKEK(passphrase: string, salt: Buffer<ArrayBuffer>): Promise<Buffer<ArrayBuffer>>
	{
		return new Promise((resolve, reject) =>
		{
			crypto.pbkdf2(Buffer.from(passphrase), salt, 600_000, 32, 'sha256', (error, derivedKey) =>
			{
				if (error) {
					reject(error);
					return;
				}

				resolve(derivedKey);
			});
		});
	}


	public static async get(name: KeyNames): Promise<Buffer | null>
	{
		if (!this.initalized) {
			await this.loadSecrets();
		}

		return this.cache[name] ?? null;
	}

	public static async loadSecrets(): Promise<void>
	{
		if (this.initalized) {
			return;
		}

		let passphrase = process.env.SECRET_STORAGE_PASSPHRASE;

		if (!passphrase) {
			passphrase = await passwordPrompt({
				message: 'The master passphrase is required to access the secret storage: ',
				mask: false,
				toggleMask: false,
			});

			if (!passphrase) {
				throw new Error('The secret storage cannot be loaded without a passphrase.');
			}
		}

		const storage = await this.#readStorageObject();

		// Get core.salt
		let salt: Buffer<ArrayBuffer>;

		if (!storage['core.salt']) {
			salt = Buffer.from(crypto.getRandomValues(new Uint8Array(32)));

			storage['core.salt'] = salt.toBase64();
		} else {
			salt = Buffer.from(storage['core.salt'], 'base64');
		}

		// DEK
		const kek = await this.#deriveKEK(passphrase, salt);
		let dek: Buffer<ArrayBuffer>;

		if (!storage['core.dek']) {
			dek = Buffer.from(crypto.getRandomValues(new Uint8Array(32)));
			const encryptedDEK = await Encryptor.encrypt(dek, kek);

			storage['core.dek'] = encryptedDEK.toBase64();
		} else {
			dek = await Encryptor.decrypt(Buffer.from(storage['core.dek'], 'base64'), kek);
		}

		// Initialize values
		const keys: KeyNames[] = [
			'encryption_key',
			'hmac_salt',
			'bogus_salt',
		];

		for (const value of keys) {
			let toCache: Buffer;

			if (!storage[value]) {
				const newValue = Buffer.from(crypto.getRandomValues(new Uint8Array(32)));
				toCache = newValue;

				const encryptedValue = await Encryptor.encrypt(newValue, dek);
				storage[value] = encryptedValue.toBase64();
			} else {
				const encryptedValue = Buffer.from(storage[value], 'base64');
				const decryptedValue = await Encryptor.decrypt(encryptedValue, dek);

				toCache = decryptedValue;
			}

			this.cache[value] = toCache;
		}

		await this.#writeStorageObject(storage);
		this.initalized = true;
	}
}
