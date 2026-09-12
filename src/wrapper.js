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

// Launching a Typescript file with top-level asynchronous functions crashes PM2. This wrapper solves the problem as
// stated in this comment by sionzee: https://github.com/oven-sh/bun/issues/19942#issuecomment-3297830230
import('./index.ts').catch(error =>
{
	console.error('Fatal error when trying to start the server.\n', error);
	process.exit(-100);
});
