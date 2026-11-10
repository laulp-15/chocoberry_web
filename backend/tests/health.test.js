// tests/health.test.js
// Prueba de humo de la API: verifica que Express esté configurado y que el
// endpoint de salud responda con el contrato público de Render.
import request from 'supertest';
import app from '../src/app.js';

describe('API - salud y manejo de rutas', () => {
  it('GET /api/health responde 200 con { ok: true }', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(app.get('trust proxy')).toBe(1);
  });

  it('una ruta inexistente responde 404 con success=false', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
  });
});
