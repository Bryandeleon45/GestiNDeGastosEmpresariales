using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MunicipalidadAPI.Migrations
{
    /// <inheritdoc />
    public partial class BCryptHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreadoEn", "PasswordHash" },
                values: new object[] { new DateTime(2026, 9, 9, 1, 48, 36, 597, DateTimeKind.Utc).AddTicks(6255), "$2a$11$oIBp8zwl54Wnbe8pi8L3feidSjaWTcEZ.g94B.d0PAGsE6gnOswLu" });

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreadoEn", "PasswordHash" },
                values: new object[] { new DateTime(2026, 9, 9, 1, 48, 36, 802, DateTimeKind.Utc).AddTicks(7453), "$2a$11$8UpKpoET8YIzzMYBQV8DUOXiXxZYZ9lN/BkZIX7XO6/P1wgqXXF8e" });

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreadoEn", "PasswordHash" },
                values: new object[] { new DateTime(2026, 9, 9, 1, 48, 37, 12, DateTimeKind.Utc).AddTicks(4876), "$2a$11$Pbnw4InS51gHu6Ul8cg4Ue1dkJIltynQFvpVAAmpAE98kKwujzbnS" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreadoEn", "PasswordHash" },
                values: new object[] { new DateTime(2026, 9, 5, 3, 59, 18, 530, DateTimeKind.Utc).AddTicks(9677), "admin123" });

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreadoEn", "PasswordHash" },
                values: new object[] { new DateTime(2026, 9, 5, 3, 59, 18, 530, DateTimeKind.Utc).AddTicks(9681), "proveedor123" });

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreadoEn", "PasswordHash" },
                values: new object[] { new DateTime(2026, 9, 5, 3, 59, 18, 530, DateTimeKind.Utc).AddTicks(9684), "proveedor123" });
        }
    }
}
