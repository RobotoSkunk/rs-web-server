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

using System.Security.Cryptography;
using System.Text;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using RobotoSkunk.Analytics.Database;
using RobotoSkunk.Analytics.Database.Entities;

using MyCSharp.HttpUserAgentParser;


namespace RobotoSkunk.Analytics.Controllers
{
	[Route("collector")]
	public class CollectorController(DatabaseContext databaseContext) : RSControllerBase
	{
		public record UserDataRecord(string IpAddress, string UserAgent);

		private readonly DatabaseContext database = databaseContext;


		[HttpPost("collect")]
		public async Task<IActionResult> Collect(UserDataRecord userData)
		{
			var uaInfo = HttpUserAgentParser.Parse(userData.UserAgent);

			if (uaInfo.IsRobot() || !uaInfo.IsBrowser()) {
				return Ok(GetResponseBase(-1, "Bot detected"));
			}

			string id = GenerateId(userData.IpAddress, userData.UserAgent);

			UniqueVisitorsPerDay? visitor = null;

			if (!await database.UniqueVisitorsPerDay.AnyAsync(v => v.Id == id)) {
				visitor = new UniqueVisitorsPerDay() {
					Id             = id,
					CreatedAt      = DateTime.UtcNow,
					Browser        = uaInfo.Name ?? "Unknown",
					BrowserVersion = uaInfo.Version ?? "-1",
					DeviceType     = (short)(uaInfo.IsMobile() ? 1 : 0),
					CountryCode    = "-1",
					Visits         = 1,
				};

				database.UniqueVisitorsPerDay.Add(visitor);
				await database.SaveChangesAsync();

			} else {
				visitor = await database.UniqueVisitorsPerDay.Where(v => v.Id == id).FirstOrDefaultAsync();
			}


			return Ok(GetResponseBase(0, $"Your ID is {id}", visitor));
		}


		private static string GenerateId(string ip, string userAgent)
		{
			byte[] bytesToHash = Encoding.ASCII.GetBytes(ip + userAgent);
			byte[] bytes = SHA256.HashData(bytesToHash);

			string hash = "";

			foreach (byte data in bytes) {
				hash += data.ToString("x2");
			}

			return hash;
		}
	}
}
