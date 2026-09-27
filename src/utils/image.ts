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
	loadImage,
} from '@napi-rs/canvas';

import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';

export const fileLimitSize = 10 * 1024 * 1024;

export async function storeImage(dataUrl: string)
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

	try {
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
	} catch (e) {
		return false;
	}
}

export async function deleteImage(filename: string)
{
	const filePath = path.join(process.env.ASSETS_DIRECTORY!, filename);
	const exists = await fs.exists(filePath);

	if (exists) {
		await Bun.file(filePath).delete();
	}
}
