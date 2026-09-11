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

import * as timers from './timers';


async function sleep(ms: number)
{
	return new Promise(resolve => setTimeout(resolve, ms));
}

export default async () =>
{
	while (true) {
		for (const timer of Object.values(timers)) {
			try {
				await timer.default();
			} catch (e) {
				console.error(e);
			}
		}

		await sleep(1000);
	}
};
