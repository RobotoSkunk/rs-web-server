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

export const tableName = 'illustrations';

type Point = {
	x: number;
	y: number;
};

export interface DB_Illustrations
{
	id?: UUID;
	picture_filename?: string;
	picture_size?: string | Point;
	picture_small_filename?: string;
	picture_small_size?: string | Point;
	hidden?: boolean;
	uploaded_at?: Date;
	created_at?: string | Date;
}

export type PartialDB = {
	[ tableName ]: DB_Illustrations,
};
