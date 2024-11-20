/*
 * robotoskunk.com web server. The backend part of robotoskunk.com
 * Copyright (C) 2024  Edgar Lima (RobotoSkunk)
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
 */

using System.ComponentModel.DataAnnotations.Schema;

using Microsoft.EntityFrameworkCore;


namespace RobotoSkunk.Analytics.Database.Entities
{
	[Table("unique_visitors_per_day")]
	[PrimaryKey(nameof(Id))]
	[Index(nameof(CreatedAt))]
	public class UniqueVisitorsPerDay
	{
		[Column(TypeName = "text")]
		public virtual required string   Id             { get; set; }

		public virtual required DateTime CreatedAt      { get; set; }
		public virtual required string   Browser        { get; set; }
		public virtual required string   BrowserVersion { get; set; }
		public virtual required short    DeviceType     { get; set; }
		public virtual required string   CountryCode    { get; set; }
		public virtual required int      Visits         { get; set; }

		public ICollection<VisitorReferrals> Referrals  { get; } = [];
		public ICollection<VisitorPages>     Pages      { get; } = [];
	}
}
