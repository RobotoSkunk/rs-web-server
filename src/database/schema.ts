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
	Kysely,
} from 'kysely';

import * as admins from './tables/admins';
import * as audit_logs from './tables/audit_logs';
import * as auth_flow from './tables/auth_flow';
import * as auth_tokens from './tables/auth_tokens';
import * as blog_content_pictures from './tables/blog_content_pictures';
import * as blog_contents from './tables/blog_contents';
import * as blog_tag_localizations from './tables/blog_tag_localizations';
import * as blog_tag_relationship from './tables/blog_tag_relationship';
import * as blog_tags from './tables/blog_tags';
import * as blogs from './tables/blogs';
import * as illustrations from './tables/illustrations';
import * as illustration_alts from './tables/illustration_alts';
import * as project_contents from './tables/project_contents';
import * as project_picture_alts from './tables/project_picture_alts';
import * as project_pictures from './tables/project_pictures';
import * as projects from './tables/projects';
import * as url_metadata from './tables/url_metadata';

export type DatabaseSchemaType =
	admins.PartialDB &
	audit_logs.PartialDB &
	auth_flow.PartialDB &
	auth_tokens.PartialDB &
	blog_content_pictures.PartialDB &
	blog_contents.PartialDB &
	blog_tag_localizations.PartialDB &
	blog_tag_relationship.PartialDB &
	blog_tags.PartialDB &
	blogs.PartialDB &
	illustrations.PartialDB &
	illustration_alts.PartialDB &
	project_contents.PartialDB &
	project_picture_alts.PartialDB &
	project_pictures.PartialDB &
	projects.PartialDB &
	url_metadata.PartialDB;

export type DatabaseSchema = Kysely<DatabaseSchemaType>;
