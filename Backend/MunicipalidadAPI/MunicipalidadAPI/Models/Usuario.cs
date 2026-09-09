using System.ComponentModel.DataAnnotations;

namespace MunicipalidadAPI.Models
{
    public class Usuario
    {
        [Key]
        public int Id { get; set; }
        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;
        [Required]
        [MaxLength(100)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = string.Empty;
        [Required]
        [MaxLength(50)]
        public string Rol { get; set; } = string.Empty;
        [MaxLength(100)]
        public string? Empresa { get; set; }
        [MaxLength(20)]
        public string? Telefono { get; set; }
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
        public DateTime? UltimoAcceso { get; set; }
    }
}