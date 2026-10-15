const solicitud = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/database');

describe('API de Reservas de Espacios - Pruebas de Integración', () => {
  const fechaBase = new Date();
  fechaBase.setDate(fechaBase.getDate() + 7);
  const rellenar = (n) => String(n).padStart(2, '0');
  const fechaTexto = `${fechaBase.getFullYear()}-${rellenar(fechaBase.getMonth() + 1)}-${rellenar(fechaBase.getDate())}`;

  let idReservaCreada;
  let codigoCancelacionValido;

  beforeAll(async () => {
    // Validacion de seguridad obligatoria: verificar que se ejecuta en la base de datos exclusiva de pruebas
    const baseDatosActual = pool.pool.config.connectionConfig.database;
    const baseDatosPruebaEsperada = process.env.DB_NAME_TEST || 'sistema_reservas_test';

    if (baseDatosActual !== baseDatosPruebaEsperada) {
      throw new Error(
        `Seguridad: las pruebas no deben ejecutarse en la base [${baseDatosActual}]. Se exige [${baseDatosPruebaEsperada}].`
      );
    }

    // Limpieza segura en la base de datos exclusiva de pruebas
    await pool.query('DELETE FROM reservations');
  });

  afterAll(async () => {
    await pool.query('DELETE FROM reservations');
    await pool.end();
  });

  describe('1. Consulta de Espacios', () => {
    test('GET /api/spaces debe listar solo espacios activos', async () => {
      const respuesta = await solicitud(app).get('/api/spaces');
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.success).toBe(true);
      expect(Array.isArray(respuesta.body.data)).toBe(true);
      expect(respuesta.body.data.length).toBeGreaterThan(0);
      respuesta.body.data.forEach((espacio) => {
        const activo = espacio.activo !== undefined ? espacio.activo : espacio.active;
        expect(activo).toBe(1);
      });
    });

    test('GET /api/spaces?minCapacity=15 debe filtrar por capacidad mínima', async () => {
      const respuesta = await solicitud(app).get('/api/spaces?minCapacity=15');
      expect(respuesta.status).toBe(200);
      respuesta.body.data.forEach((espacio) => {
        const capacidad = espacio.capacidad !== undefined ? espacio.capacidad : espacio.capacity;
        expect(capacidad).toBeGreaterThanOrEqual(15);
      });
    });

    test('GET /api/spaces/availability debe retornar espacios disponibles para un horario', async () => {
      const fechaInicio = `${fechaTexto} 08:00:00`;
      const fechaFin = `${fechaTexto} 10:00:00`;

      const respuesta = await solicitud(app)
        .get('/api/spaces/availability')
        .query({ startTime: fechaInicio, endTime: fechaFin });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.success).toBe(true);
      expect(Array.isArray(respuesta.body.data)).toBe(true);
    });
  });

  describe('2. Registro de Reservas y Reglas de Negocio', () => {
    test('POST /api/reservations debe crear una reserva válida con código privado de 128 bits (32 caracteres hex)', async () => {
      const cargaDatos = {
        espacioId: 1,
        nombreCliente: 'Ana Tester',
        correoCliente: 'ana@test.com',
        fechaInicio: `${fechaTexto} 10:00:00`,
        fechaFin: `${fechaTexto} 12:00:00`
      };

      const respuesta = await solicitud(app).post('/api/reservations').send(cargaDatos);

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.success).toBe(true);
      expect(respuesta.body.data).toHaveProperty('id');
      expect(respuesta.body.data).toHaveProperty('codigoCancelacion');

      // Verifica 128 bits de entropía en formato hexadecimal (32 caracteres)
      expect(respuesta.body.data.codigoCancelacion).toMatch(/^[a-f0-9]{32}$/);

      idReservaCreada = respuesta.body.data.id;
      codigoCancelacionValido = respuesta.body.data.codigoCancelacion;
    });

    test('POST /api/reservations debe rechazar una reserva con horario superpuesto (409 Conflict)', async () => {
      const cargaSuperpuesta = {
        espacioId: 1,
        nombreCliente: 'Carlos Overlap',
        correoCliente: 'carlos@test.com',
        fechaInicio: `${fechaTexto} 11:00:00`,
        fechaFin: `${fechaTexto} 13:00:00`
      };

      const respuesta = await solicitud(app).post('/api/reservations').send(cargaSuperpuesta);

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.success).toBe(false);
      expect(respuesta.body.error.message).toMatch(/ya se encuentra reservado/i);
    });

    test('POST /api/reservations debe rechazar fechas inválidas (fin <= inicio)', async () => {
      const cargaInvalida = {
        espacioId: 1,
        nombreCliente: 'Pedro Invalido',
        correoCliente: 'pedro@test.com',
        fechaInicio: `${fechaTexto} 15:00:00`,
        fechaFin: `${fechaTexto} 14:00:00`
      };

      const respuesta = await solicitud(app).post('/api/reservations').send(cargaInvalida);

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.success).toBe(false);
      expect(respuesta.body.error.message).toMatch(/posterior/i);
    });

    test('POST /api/reservations debe rechazar fechas pasadas', async () => {
      const cargaPasada = {
        espacioId: 1,
        nombreCliente: 'Viajero del Tiempo',
        correoCliente: 'tiempo@test.com',
        fechaInicio: '2020-01-01 10:00:00',
        fechaFin: '2020-01-01 12:00:00'
      };

      const respuesta = await solicitud(app).post('/api/reservations').send(cargaPasada);

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.success).toBe(false);
      expect(respuesta.body.error.message).toMatch(/pasad/i);
    });

    test('POST /api/reservations debe rechazar un espacio inexistente (404 Not Found)', async () => {
      const cargaFantasma = {
        espacioId: 99999,
        nombreCliente: 'Test Fantasma',
        correoCliente: 'fantasma@test.com',
        fechaInicio: `${fechaTexto} 14:00:00`,
        fechaFin: `${fechaTexto} 16:00:00`
      };

      const respuesta = await solicitud(app).post('/api/reservations').send(cargaFantasma);

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.success).toBe(false);
      expect(respuesta.body.error.message).toMatch(/no existe/i);
    });

    test('POST /api/reservations debe rechazar reservar un espacio inactivo (400 Bad Request)', async () => {
      const cargaInactiva = {
        espacioId: 6,
        nombreCliente: 'Test Inactivo',
        correoCliente: 'inactivo@test.com',
        fechaInicio: `${fechaTexto} 14:00:00`,
        fechaFin: `${fechaTexto} 16:00:00`
      };

      const respuesta = await solicitud(app).post('/api/reservations').send(cargaInactiva);

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.success).toBe(false);
      expect(respuesta.body.error.message).toMatch(/inactivo/i);
    });
  });

  describe('3. Consulta y Cancelación de Reservas', () => {
    test('POST /api/reservations/lookup con código válido debe retornar datos sin revelar el hash', async () => {
      const respuesta = await solicitud(app)
        .post('/api/reservations/lookup')
        .send({
          idReserva: idReservaCreada,
          codigoCancelacion: codigoCancelacionValido
        });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.success).toBe(true);
      expect(respuesta.body.data.id).toBe(idReservaCreada);
      expect(respuesta.body.data.hashCodigoCancelacion).toBeUndefined();
      expect(respuesta.body.data.cancellationCodeHash).toBeUndefined();
    });

    test('POST /api/reservations/lookup con código incorrecto debe ser rechazado (401)', async () => {
      const respuesta = await solicitud(app)
        .post('/api/reservations/lookup')
        .send({
          idReserva: idReservaCreada,
          codigoCancelacion: '0123456789abcdef0123456789abcdef'
        });

      expect(respuesta.status).toBe(401);
      expect(respuesta.body.success).toBe(false);
    });

    test('POST /api/reservations/:id/cancel con código incorrecto debe ser rechazado (401)', async () => {
      const respuesta = await solicitud(app)
        .post(`/api/reservations/${idReservaCreada}/cancel`)
        .send({ codigoCancelacion: '0123456789abcdef0123456789abcdef' });

      expect(respuesta.status).toBe(401);
      expect(respuesta.body.success).toBe(false);
    });

    test('POST /api/reservations/:id/cancel con código correcto debe cancelar y liberar el espacio', async () => {
      const respuesta = await solicitud(app)
        .post(`/api/reservations/${idReservaCreada}/cancel`)
        .send({ codigoCancelacion: codigoCancelacionValido });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.success).toBe(true);
      expect(respuesta.body.data.status).toBe('cancelled');

      const nuevaCarga = {
        espacioId: 1,
        nombreCliente: 'Beto Rebook',
        correoCliente: 'beto@test.com',
        fechaInicio: `${fechaTexto} 10:00:00`,
        fechaFin: `${fechaTexto} 12:00:00`
      };

      const respuestaNueva = await solicitud(app).post('/api/reservations').send(nuevaCarga);
      expect(respuestaNueva.status).toBe(201);
    });

    test('POST /api/reservations/:id/cancel no debe permitir cancelar dos veces la misma reserva (409)', async () => {
      const respuesta = await solicitud(app)
        .post(`/api/reservations/${idReservaCreada}/cancel`)
        .send({ codigoCancelacion: codigoCancelacionValido });

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.success).toBe(false);
      expect(respuesta.body.error.message).toMatch(/cancelada con anterioridad/i);
    });
  });

  describe('4. Prevención de Condiciones de Carrera (Concurrencia)', () => {
    test('Dos solicitudes simultáneas de reserva para el mismo horario no deben producir doble reserva', async () => {
      const horarioInicio = `${fechaTexto} 16:00:00`;
      const horarioFin = `${fechaTexto} 18:00:00`;

      const solicitudA = {
        espacioId: 2,
        nombreCliente: 'Concurrente A',
        correoCliente: 'userA@test.com',
        fechaInicio: horarioInicio,
        fechaFin: horarioFin
      };

      const solicitudB = {
        espacioId: 2,
        nombreCliente: 'Concurrente B',
        correoCliente: 'userB@test.com',
        fechaInicio: horarioInicio,
        fechaFin: horarioFin
      };

      // Dispara ambas peticiones al mismo instante mediante Promise.all
      const [respuestaA, respuestaB] = await Promise.all([
        solicitud(app).post('/api/reservations').send(solicitudA),
        solicitud(app).post('/api/reservations').send(solicitudB)
      ]);

      const estados = [respuestaA.status, respuestaB.status].sort();

      expect(estados).toEqual([201, 409]);

      const [filas] = await pool.query(
        'SELECT id, customer_name, status FROM reservations WHERE space_id = 2 AND start_time = ? AND status = "confirmed"',
        [horarioInicio]
      );
      expect(filas.length).toBe(1);
    });

    test('Dos solicitudes simultáneas de cancelación para la misma reserva no deben ser exitosas a la vez', async () => {
      // 1. Crear una nueva reserva para probar cancelación concurrente
      const resCrear = await solicitud(app).post('/api/reservations').send({
        espacioId: 3,
        nombreCliente: 'Cliente Doble Cancel',
        correoCliente: 'doblecancel@test.com',
        fechaInicio: `${fechaTexto} 18:00:00`,
        fechaFin: `${fechaTexto} 20:00:00`
      });

      expect(resCrear.status).toBe(201);
      const reservaId = resCrear.body.data.id;
      const codigo = resCrear.body.data.codigoCancelacion;

      // 2. Disparar dos cancelaciones exactamente al mismo tiempo
      const [cancelA, cancelB] = await Promise.all([
        solicitud(app).post(`/api/reservations/${reservaId}/cancel`).send({ codigoCancelacion: codigo }),
        solicitud(app).post(`/api/reservations/${reservaId}/cancel`).send({ codigoCancelacion: codigo })
      ]);

      const estadosCancel = [cancelA.status, cancelB.status].sort();

      // Mediante la actualizacion condicional (UPDATE ... WHERE status = 'confirmed'), exactamente una afecta 1 fila
      expect(estadosCancel).toEqual([200, 409]);

      const exitosa = cancelA.status === 200 ? cancelA : cancelB;
      const conflictiva = cancelA.status === 409 ? cancelA : cancelB;

      expect(exitosa.body.data.status).toBe('cancelled');
      expect(conflictiva.body.error.message).toMatch(/cancelada con anterioridad/i);
    });
  });

  describe('5. Límite de Solicitudes y Protección contra Fuerza Bruta (Rate Limiting)', () => {
    test('Debe responder 429 Too Many Requests cuando se excede el límite de intentos en endpoints sensibles', async () => {
      // Realizar solicitudes repetidas para forzar el límite de tasa
      const peticiones = [];
      for (let i = 0; i < 35; i++) {
        peticiones.push(
          solicitud(app)
            .post('/api/reservations/lookup')
            .send({ idReserva: 9999, codigoCancelacion: 'intento-invalido' })
        );
      }

      const respuestas = await Promise.all(peticiones);
      const respuestasBloqueadas = respuestas.filter((r) => r.status === 429);

      // Al menos las peticiones que superaron el límite debieron retornar 429
      expect(respuestasBloqueadas.length).toBeGreaterThan(0);
      expect(respuestasBloqueadas[0].body.error.statusCode).toBe(429);
      expect(respuestasBloqueadas[0].body.error.message).toMatch(/Demasiados intentos/i);
    });
  });
});
