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
	Elysia,
	t,
} from 'elysia';

import Secrets from '../../crypto/secrets';
import Admin from '../../entities/admin';
import Encryptor from '../../crypto/encryptor';

import crypto from 'node:crypto';
import AuthFlow from '../../entities/auth-flow';


async function wait()
{
	return new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 3000));
}

const route = new Elysia({ prefix: 'auth' })
	.post('challenge', async ({ body }) =>
	{
		await wait();

		const admin = await Admin.findByUsername(body.username);

		if (!admin) {
			const bogusSalt = await Secrets.get('crypto.bogus_salt')!;

			return {
				session_id: crypto.randomUUID(),
				srp_salt: Encryptor.hmac(body.username, bogusSalt!).toUpperCase(),
				ephemeral: crypto.getRandomValues(new Uint8Array(32)).toHex().toUpperCase(),
			};
		}

		const challengeResponse = await AuthFlow.challenge(admin);

		return {
			session_id: challengeResponse.id,
			srp_salt: challengeResponse.salt,
			ephemeral: challengeResponse.ephemeral,
		};
	}, {
		body: t.Object({
			username: t.String(),
			client_ephemeral: t.String(),
		}),
	})
	.post('verify', async ({ body }) =>
	{
		await wait();
		const authFlow = await AuthFlow.findAuthFlow(body.session_id);

		if (!authFlow) {
			return {
				success: false,
			};
		}

		const response = await authFlow.verify(body.session_proof);

		if (!response) {
			return {
				success: false,
			};
		}

		return {
			success: true,
			proof: response.proof,
			verifier: response.verifier,
		};
	}, {
		body: t.Object({
			session_id: t.String({ format: 'ipv4' }),
			session_proof: t.String(),
		}),
	})
	.post('authenticate', async ({ body }) =>
	{
		await wait();
		const authFlow = await AuthFlow.findAuthFlow(body.session_id);

		if (!authFlow) {
			return {
				success: false,
			};
		}

		const verifierIsValid = await authFlow.validateVerifier(body.verifier);

		if (!verifierIsValid) {
			return {
				success: false,
			};
		}

		const totpEquals = await authFlow.admin.validateTotp(body.totp_token);

		if (!totpEquals) {
			return {
				success: false,
			};
		}

		// TODO: add the authentication token cookie generation.

		return {
			success: true,
		};
	}, {
		body: t.Object({
			session_id: t.String({ format: 'ipv4' }),
			verifier: t.String(),
			totp_token: t.String(),
		}),
	})
;

export default route;
