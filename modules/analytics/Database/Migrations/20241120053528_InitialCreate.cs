using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace modules.Database.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "unique_visitors_per_day",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    browser = table.Column<string>(type: "text", nullable: false),
                    browser_version = table.Column<string>(type: "text", nullable: false),
                    device_type = table.Column<short>(type: "smallint", nullable: false),
                    country_code = table.Column<string>(type: "text", nullable: false),
                    visits = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_unique_visitors_per_day", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "visitor_pages",
                columns: table => new
                {
                    visitor_id = table.Column<string>(type: "text", nullable: false),
                    page = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_visitor_pages", x => new { x.visitor_id, x.page });
                    table.ForeignKey(
                        name: "fk_visitor_pages_unique_visitors_per_day_visitor_id",
                        column: x => x.visitor_id,
                        principalTable: "unique_visitors_per_day",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "visitor_referrals",
                columns: table => new
                {
                    visitor_id = table.Column<string>(type: "text", nullable: false),
                    referral = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_visitor_referrals", x => new { x.visitor_id, x.referral });
                    table.ForeignKey(
                        name: "fk_visitor_referrals_unique_visitors_per_day_visitor_id",
                        column: x => x.visitor_id,
                        principalTable: "unique_visitors_per_day",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_unique_visitors_per_day_created_at",
                table: "unique_visitors_per_day",
                column: "created_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "visitor_pages");

            migrationBuilder.DropTable(
                name: "visitor_referrals");

            migrationBuilder.DropTable(
                name: "unique_visitors_per_day");
        }
    }
}
