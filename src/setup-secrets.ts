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

import Secrets from './crypto/secrets';

import crypto from 'node:crypto';

if (!Secrets.get('crypto.hmac_key')) {
	const hmacKey = crypto.getRandomValues(new Uint8Array(32));

	Secrets.set('crypto.hmac_key', hmacKey.toBase64());
}

if (!Secrets.get('crypto.encryption_key')) {
	const encryptionKey = crypto.getRandomValues(new Uint8Array(32));

	Secrets.set('crypto.encryption_key', encryptionKey.toBase64());
}

if (!Secrets.get('crypto.bogus_salt')) {
	const bogusSalt = crypto.getRandomValues(new Uint8Array(32));
	Secrets.set('crypto.encryption_key', bogusSalt.toBase64());
}
