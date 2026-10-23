import "dotenv/config";

const PLACEHOLDER = "cambia-este-secreto-en-produccion";
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret === PLACEHOLDER || jwtSecret.length < 32) {
  throw new Error(
    "JWT_SECRET no configurado: define un secreto aleatorio de al menos 32 caracteres en Backend/.env",
  );
}

export const env = {
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  port: Number(process.env.PORT || 4000),
};
