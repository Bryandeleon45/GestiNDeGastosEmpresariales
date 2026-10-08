import { EventEmitter } from "node:events";

// Módulo de eventos internos (sección 5 del plan de integración).
// Un módulo emite un evento cuando ocurre algo importante; los demás
// se suscriben para crear notificaciones o ejecutar la siguiente acción.
// Las reacciones que cambian datos deben correr dentro de la transacción
// del emisor (ver portal.js). Si luego se necesitara una cola, se mantiene
// el mismo contrato sin tocar los módulos.
export const eventos = new EventEmitter();

export function emitir(evento, payload = {}) {
  eventos.emit(evento, payload);
}

export function on(evento, handler) {
  eventos.on(evento, handler);
}

export function once(evento, handler) {
  eventos.once(evento, handler);
}
