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
	$,
} from 'bun';

import {
	input,
} from '@inquirer/prompts';

import passwordPrompt from '@inquirer/password';
import SRP from 'secure-remote-password/client';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

import Admin from '../src/entities/admin';

const exitCode = (await $`sudo -k -S true`.nothrow()).exitCode;

if (exitCode !== 0) {
	process.exit(0);
}

const username = await input({ message: 'Username: ' });
const password = await passwordPrompt({ message: 'Password: ' });

const userId = crypto.randomUUID();
const salt = SRP.generateSalt();

const encoder = new TextEncoder();
const bcryptSalt = bcrypt.encodeBase64(encoder.encode(salt), 16);
const passwordHash = await bcrypt.hash(password, `$2b$10$${bcryptSalt}`);

const privateKey = SRP.derivePrivateKey(salt, userId, passwordHash);
const verifier = SRP.deriveVerifier(privateKey);

const totpSecret = await Admin.register(userId, username, salt, verifier);

console.log('TOTP Secret: ' + totpSecret);
process.exit(0);
