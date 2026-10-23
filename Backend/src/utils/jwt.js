import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function firmarToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    algorithm: "HS256",
  });
}

export function verificarToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
}
