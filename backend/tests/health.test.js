// tests/health.test.js
// Prueba de humo de la API: verifica que Express esté configurado y que el
// endpoint de salud responda con la forma uniforme { success, message, data }.
import request from 'supertest';
import app from '../src/app.js';

describe('API - salud y manejo de rutas', () => {
  it('GET /api/health responde 200 con success=true', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('message');
  });

  it('una ruta inexistente responde 404 con success=false', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
  });
});
