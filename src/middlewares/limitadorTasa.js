function crearLimitadorTasa({
  ventanaMs = 15 * 60 * 1000,
  maximoIntentos = process.env.NODE_ENV === 'test' ? 25 : 10,
  mensaje = 'Demasiados intentos. Por favor, intente nuevamente más tarde.'
} = {}) {
  const registroSolicitudes = new Map();

  const temporizadorLimpieza = setInterval(() => {
    const ahora = Date.now();
    for (const [clave, datos] of registroSolicitudes.entries()) {
      if (ahora - datos.inicioVentana > ventanaMs) {
        registroSolicitudes.delete(clave);
      }
    }
  }, ventanaMs);

  if (temporizadorLimpieza.unref) {
    temporizadorLimpieza.unref();
  }

  return (req, res, next) => {
    const clave = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'cliente-local';
    const ahora = Date.now();

    const registro = registroSolicitudes.get(clave);

    if (!registro || ahora - registro.inicioVentana > ventanaMs) {
      registroSolicitudes.set(clave, { inicioVentana: ahora, conteo: 1 });
      return next();
    }

    registro.conteo += 1;

    if (registro.conteo > maximoIntentos) {
      return res.status(429).json({
        success: false,
        error: {
          message: mensaje,
          statusCode: 429
        }
      });
    }

    next();
  };
}

module.exports = crearLimitadorTasa;
