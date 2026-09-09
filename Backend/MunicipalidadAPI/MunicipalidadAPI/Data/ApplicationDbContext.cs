using Microsoft.EntityFrameworkCore;
using MunicipalidadAPI.Models;
using BCrypt.Net;

namespace MunicipalidadAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Usuario> Usuarios { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Usuario>().HasData(
                new Usuario
                {
                    Id = 1,
                    Nombre = "Lic. Ricardo Gómez",
                    Email = "admin@panajachel.gob",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    Rol = "administrador",
                    Empresa = null,
                    CreadoEn = DateTime.UtcNow
                },
                new Usuario
                {
                    Id = 2,
                    Nombre = "Suministros El Lago S.A.",
                    Email = "proveedor@ellago.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("proveedor123"),
                    Rol = "proveedor",
                    Empresa = "Suministros El Lago S.A.",
                    CreadoEn = DateTime.UtcNow
                },
                new Usuario
                {
                    Id = 3,
                    Nombre = "Materiales Pana",
                    Email = "proveedor2@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("proveedor123"),
                    Rol = "proveedor",
                    Empresa = "Materiales Pana",
                    CreadoEn = DateTime.UtcNow
                }
            );
        }
    }
}