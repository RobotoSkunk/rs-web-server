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

import {
	getClient,
} from '../../database/client';

import {
	loadImage,
} from '@napi-rs/canvas';

import crypto from 'crypto';
import path from 'path';

const fileLimitSize = 10 * 1024 * 1024;

async function processImage(dataUrl: string)
{
	if (!dataUrl.startsWith('data:image/')) {
		return false;
	}

	const split = dataUrl.split(',');
	
	if (split.length != 2) {
		return false;
	}

	if (!split[0]!.match(/^data:image\/(?:webp|jpeg|png)(?:;base64)?$/)) {
		return false;
	}

	const extension = split[0]!.replace('data:image/', '').split(';')[0]!;

	const filename = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url') + `.${extension}`;
	const buffer = Buffer.from(split[1]!, 'base64');

	const image = await loadImage(dataUrl);
	await Bun.file(path.join(process.env.ASSETS_DIRECTORY!, filename)).write(buffer);

	return {
		filename,
		buffer,
		size: {
			x: image.width,
			y: image.height,
		},
	};
}


const route = new Elysia({ prefix: '/illustrations' })
	.get('list', async () =>
	{
		const list = await getClient().conn
			.selectFrom('illustrations')
			.select([
				'id',
				'illustrations.picture_small_filename as filename',
				'picture_small_size as size',
				'hidden',
			])
			.orderBy('uploaded_at')
			.execute();

		return list;
	})
	.post('upload', async ({ body, status }) =>
	{
		try {
			if (body.picture.length > fileLimitSize || body.picture_small.length > fileLimitSize) {
				return status(413, {
					error: {
						message: 'The maximum file size allowed is 10 MiB.',
					},
				});
			}

			const picture = await processImage(body.picture);
			const pictureSmall = await processImage(body.picture_small);

			if (!picture || !pictureSmall) {
				return status(400, {
					error: {
						message: 'Bad request.',
					},
				});
			}

			await Bun.file(path.join(process.env.ASSETS_DIRECTORY!, picture.filename)).write(picture.buffer);
			await Bun.file(path.join(process.env.ASSETS_DIRECTORY!, pictureSmall.filename)).write(pictureSmall.buffer);

			const now = new Date();

			const { id } = await getClient().conn
				.insertInto('illustrations')
				.values({
					picture_filename: picture.filename,
					picture_small_filename: pictureSmall.filename,
					picture_size: `(${picture.size.x}, ${picture.size.y})`,
					picture_small_size: `(${pictureSmall.size.x}, ${pictureSmall.size.y})`,
					created_at: `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
					hidden: true,
				})
				.returning('id')
				.executeTakeFirstOrThrow();

			return {
				success: true,
				id,
			}
		} catch (e) {
			console.error(e);
			return status(500);
		}
	}, {
		body: t.Object({
			picture: t.String(),
			picture_small: t.String(),
		}),
	})
;

export default route;
