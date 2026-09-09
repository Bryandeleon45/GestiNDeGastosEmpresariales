using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MunicipalidadAPI.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Rol = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Empresa = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UltimoAcceso = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "CreadoEn", "Email", "Empresa", "Nombre", "PasswordHash", "Rol", "Telefono", "UltimoAcceso" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 9, 5, 3, 59, 18, 530, DateTimeKind.Utc).AddTicks(9677), "admin@panajachel.gob", null, "Lic. Ricardo Gómez", "admin123", "administrador", null, null },
                    { 2, new DateTime(2026, 9, 5, 3, 59, 18, 530, DateTimeKind.Utc).AddTicks(9681), "proveedor@ellago.com", "Suministros El Lago S.A.", "Suministros El Lago S.A.", "proveedor123", "proveedor", null, null },
                    { 3, new DateTime(2026, 9, 5, 3, 59, 18, 530, DateTimeKind.Utc).AddTicks(9684), "proveedor2@gmail.com", "Materiales Pana", "Materiales Pana", "proveedor123", "proveedor", null, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
