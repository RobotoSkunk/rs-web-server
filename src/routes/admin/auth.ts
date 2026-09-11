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


async function waitForTheTurtleCrossingTheRoad()
{
	return new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 3000));
}

async function wait(min: number, max: number)
{
	return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

const route = new Elysia({ prefix: '/auth' })
	.onBeforeHandle(({ cookie, status }) =>
	{
		if (cookie.auth_token?.value) {
			throw status(403, {
				error: {
					message: 'Unauthorized.',
				},
			});
		}
	})
	.post('challenge', async ({ body }) =>
	{
		await waitForTheTurtleCrossingTheRoad();

		const admin = await Admin.findByUsername(body.username);

		if (!admin) {
			await wait(18, 20);

			const bogusSalt = (await Secrets.get('crypto.bogus_salt'))!;
			const bogusUuidHash = Encryptor.hmac(body.username + '-uuid', bogusSalt + '-uuid');

			const bogusUuid = [
				bogusUuidHash.slice(0, 8),
				bogusUuidHash.slice(8, 12),
				'4' + bogusUuidHash.slice(13, 16),
				bogusUuidHash.slice(16, 20),
				bogusUuidHash.slice(20, 32)
			].join('-');

			return {
				session_id: crypto.randomUUID(),
				user_id: bogusUuid,
				srp_salt: Encryptor.hmac(body.username, bogusSalt),
				ephemeral: crypto.getRandomValues(new Uint8Array(32)).toHex(),
			};
		}

		const challengeResponse = await AuthFlow.challenge(admin, body.client_ephemeral);

		return {
			session_id: challengeResponse.id,
			user_id: admin.id,
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
		await waitForTheTurtleCrossingTheRoad();

		const authFlow = await AuthFlow.findAuthFlow(body.session_id);

		if (!authFlow) {
			await wait(56, 58);

			return {
				success: false,
			};
		}

		const response = await authFlow.verify(body.session_proof);

		if (!response) {
			await authFlow.delete();

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
			session_id: t.String({ format: 'uuid' }),
			session_proof: t.String(),
		}),
	})
	.post('authenticate', async ({ body }) =>
	{
		await waitForTheTurtleCrossingTheRoad();

		const authFlow = await AuthFlow.findAuthFlow(body.session_id);

		if (!authFlow) {
			await wait(3, 3);

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

		if (!totpEquals.valid) {
			return {
				success: false,
			};
		}

		await authFlow.delete();
		// TODO: add the authentication token cookie generation.

		return {
			success: true,
		};
	}, {
		body: t.Object({
			session_id: t.String({ format: 'uuid' }),
			verifier: t.String(),
			totp_token: t.String({ minLength: 6, maxLength: 6 }),
		}),
	})
;

export default route;
