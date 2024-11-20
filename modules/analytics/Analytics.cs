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

using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;

using RobotoSkunk.Analytics.Database;


namespace RobotoSkunk.Analytics
{
	public static class Analytics
	{
		public static void Main(string[] args)
		{
			WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

			builder.Services.AddEndpointsApiExplorer();
			builder.Services.AddSwaggerGen(c =>
			{
				c.SwaggerDoc("v1", new OpenApiInfo());
			});

			builder.Services.AddControllers();

			builder.Services.AddDbContext<DatabaseContext>(options => options
				.UseNpgsql(
					builder.Configuration.GetConnectionString("DatabaseConnection")
				)
				.UseSnakeCaseNamingConvention()
			);


			// Start of APP
			WebApplication app = builder.Build();


			// Initialize database
			using (var scope = app.Services.CreateScope())
			{
				var services = scope.ServiceProvider;

				var context = services.GetRequiredService<DatabaseContext>();
				context.Database.Migrate();
			}

			// Endpoints
			app.MapControllers();


			if (app.Environment.IsDevelopment()) {
				// Swagger
				app.UseSwagger();
				app.UseSwaggerUI(c =>
				{
					c.SwaggerEndpoint("/swagger/v1/swagger.json", "robotoskunk.com - Analytics API");
				});
			}


			// Start
			app.Run();
		}
	}
}
