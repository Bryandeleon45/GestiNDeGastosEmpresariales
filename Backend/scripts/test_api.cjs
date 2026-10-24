const http = require('http');
function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: 4000, path, method: options.method || 'GET', headers: options.headers || {} }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, data }); } });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}
(async () => {
  try {
    const login = await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: { usuario: 'admin', password: 'danny123' } });
    const token = login.data && login.data.token;
    console.log('Login:', login.status);
    if (!token) { console.log(JSON.stringify(login.data)); return; }
    const auth = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

    const reqs = await request('/api/requisiciones', { headers: auth });
    console.log('Requisiciones list:', reqs.status, JSON.stringify(reqs.data).slice(0, 200));

    const resumen = await request('/api/requisiciones/resumen', { headers: auth });
    console.log('Resumen:', resumen.status, JSON.stringify(resumen.data));

    const um = await request('/api/requisiciones/unidades-medida', { headers: auth });
    console.log('Unidades:', um.status, JSON.stringify(um.data).slice(0, 200));

    const tipos = await request('/api/requisiciones/tipos-solicitud', { headers: auth });
    console.log('Tipos:', tipos.status, JSON.stringify(tipos.data));

    // Crear requisición de prueba
    const crear = await request('/api/requisiciones', {
      method: 'POST', headers: auth,
      body: { tipo_solicitud: 'Compra de Materiales', justificacion: 'Prueba de creación de solicitud', prioridad: 'Media', items: [{ id_unidad_medida: 1, descripcion_libre: 'Papel Bond', cantidad: 10, precio_estimado: 50 }] }
    });
    console.log('Crear:', crear.status, JSON.stringify(crear.data));
  } catch(e) { console.error('Error:', e.message); }
})();
