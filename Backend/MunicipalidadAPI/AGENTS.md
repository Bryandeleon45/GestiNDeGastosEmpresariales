# AGENTS.md — MunicipalidadAPI

## Inicio rápido

- **Ejecutar la app**: `dotnet run` (desde `MunicipalidadAPI/`)
- **Compilar**: `dotnet build`
- **Probar**: no hay proyecto de tests unitarios; verificar manualmente mediante Swagger en `/swagger`

## Arquitectura

- **Aplicación única** .NET 8 Web API (no monorepo)
- **ORM**: EF Core 8 + Npgsql para PostgreSQL
- **Base de datos**: conexión `DefaultConnection` en `appsettings.json` (PostgreSQL en `localhost:5432`)
- **Auth**: JWT Bearer — la clave viene de `appsettings.json` `Jwt:Key`. El valor por defecto es `"mi_clave_secreta_jwt_123456_que_debe_ser_larga_y_segura"`. Cambiarla invalida todos los tokens existentes.
- **CORS**: Política `"AllowAll"` permite cualquier origen/método/cabecera (solo desarrollo)
- **Swagger**: Solo está habilitado cuando `ASPNETCORE_ENVIRONMENT=Development`
- **Datos iniciales**: `ApplicationDbContext.OnModelCreating` inserta 3 usuarios por defecto (IDs 1‑3). No los reordene sin re-seed.

## Comandos importantes

- **Añadir migración EF**: `dotnet ef migrations add <nombre>` (requiere `Microsoft.EntityFrameworkCore.Tools`; ejecútese desde `MunicipalidadAPI/`)
- **Actualizar BD**: `dotnet ef database update`
- **Ejecutar con entorno dev**: `ASPNETCORE_ENVIRONMENT=Development dotnet run`

## Gotchas

- La clave JWT por defecto está en `Program.cs` y `appsettings.json`. Cambiar solo uno de los dos rompe la compatibilidad.
- `Login` compara contraseñas en texto plano (`request.Password != usuario.PasswordHash`). Es intención para el prototipo, no para producción.
- `dotnet ef` debe ejecutarse desde `MunicipalidadAPI/` o el proyecto debe restaurarse primero.
- Los usuarios por defecto tienen credenciales fijas: `admin@panajachel.gob` / `admin123`, `proveedor@ellago.com` / `proveedor123`, `proveedor2@gmail.com` / `proveedor123`. Sus IDs son 1, 2, 3 respectivamente.