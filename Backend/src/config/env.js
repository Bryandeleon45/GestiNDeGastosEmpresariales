import "dotenv/config";

export const env = {
  jwtSecret: process.env.JWT_SECRET || "cambia-este-secreto-en-produccion",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  port: Number(process.env.PORT || 4000),
};
