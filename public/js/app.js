const estado = {
  espacios: [],
  espacioSeleccionado: null,
  filtroActivo: null,
  reservaConsultada: null,
  codigoConsultaActual: null
};

const elementos = {
  cuadriculaEspacios: document.getElementById('spacesGrid'),
  cargandoCatalogo: document.getElementById('catalogLoading'),
  catalogoVacio: document.getElementById('catalogEmpty'),
  contadorEspacios: document.getElementById('spacesCountBadge'),
  subtituloCatalogo: document.getElementById('catalogSubtitle'),
  botonRestablecerVacio: document.getElementById('btnEmptyReset'),

  formularioFiltros: document.getElementById('filterForm'),
  filtroFechaInicio: document.getElementById('filterStartDate'),
  filtroFechaFin: document.getElementById('filterEndDate'),
  filtroCapacidad: document.getElementById('filterCapacity'),
  botonBuscarDisponibilidad: document.getElementById('btnSearchAvailability'),
  botonRestablecerFiltros: document.getElementById('btnResetFilters'),

  modalReserva: document.getElementById('bookingModal'),
  formularioReserva: document.getElementById('bookingForm'),
  modalIdEspacio: document.getElementById('modalSpaceId'),
  modalNombreEspacio: document.getElementById('modalSpaceName'),
  modalInfoEspacio: document.getElementById('modalSpaceInfo'),
  nombreCliente: document.getElementById('customerName'),
  correoCliente: document.getElementById('customerEmail'),
  inicioReserva: document.getElementById('bookingStart'),
  finReserva: document.getElementById('bookingEnd'),
  botonCerrarModal: document.getElementById('btnCloseModal'),
  botonCancelarReservaModal: document.getElementById('btnCancelBooking'),
  botonConfirmarReserva: document.getElementById('btnSubmitBooking'),
  alertaModal: document.getElementById('modalAlert'),

  modalExito: document.getElementById('successModal'),
  exitoIdReserva: document.getElementById('succResId'),
  exitoNombreEspacio: document.getElementById('succSpaceName'),
  exitoHorario: document.getElementById('succSchedule'),
  exitoCliente: document.getElementById('succCustomer'),
  exitoValorCodigo: document.getElementById('succCodeValue'),
  botonCopiarCodigo: document.getElementById('btnCopyCode'),
  botonCerrarExito: document.getElementById('btnCloseSuccess'),

  formularioConsulta: document.getElementById('lookupForm'),
  inputConsultaId: document.getElementById('lookupId'),
  inputConsultaCodigo: document.getElementById('lookupCode'),
  botonConsultar: document.getElementById('btnLookup'),
  resultadoConsulta: document.getElementById('lookupResult'),
  detalleId: document.getElementById('resDetailId'),
  detalleEstadoBadge: document.getElementById('resDetailStatusBadge'),
  detalleEspacio: document.getElementById('resDetailSpace'),
  detalleUbicacion: document.getElementById('resDetailLocation'),
  detalleCliente: document.getElementById('resDetailCustomer'),
  detalleCorreo: document.getElementById('resDetailEmail'),
  detalleInicio: document.getElementById('resDetailStart'),
  detalleFin: document.getElementById('resDetailEnd'),
  botonConfirmarCancelacion: document.getElementById('btnConfirmCancel'),
  contenedorAccionesCancelacion: document.getElementById('cancelActionsContainer'),

  contenedorNotificaciones: document.getElementById('toastContainer')
};

document.addEventListener('DOMContentLoaded', () => {
  configurarFechasPorDefecto();
  cargarTodosLosEspacios();
  vincularEventos();
});

// Preconfigura fechas sugeridas para el día siguiente evitando reservas en el pasado
function configurarFechasPorDefecto() {
  const maniana = new Date();
  maniana.setDate(maniana.getDate() + 1);
  maniana.setMinutes(0);
  maniana.setSeconds(0);

  const inicio = new Date(maniana);
  inicio.setHours(9);

  const fin = new Date(maniana);
  fin.setHours(11);

  const formatearLocal = (fecha) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
  };

  const ahoraFormateado = formatearLocal(new Date());
  elementos.filtroFechaInicio.min = ahoraFormateado;
  elementos.filtroFechaFin.min = ahoraFormateado;
  elementos.inicioReserva.min = ahoraFormateado;
  elementos.finReserva.min = ahoraFormateado;

  elementos.filtroFechaInicio.value = formatearLocal(inicio);
  elementos.filtroFechaFin.value = formatearLocal(fin);
}

function vincularEventos() {
  elementos.formularioFiltros.addEventListener('submit', manejarEnvioFiltros);
  elementos.botonRestablecerFiltros.addEventListener('click', restablecerFiltros);
  elementos.botonRestablecerVacio.addEventListener('click', restablecerFiltros);

  elementos.botonCerrarModal.addEventListener('click', cerrarModalReserva);
  elementos.botonCancelarReservaModal.addEventListener('click', cerrarModalReserva);
  elementos.formularioReserva.addEventListener('submit', manejarEnvioReserva);
  elementos.botonCerrarExito.addEventListener('click', () => elementos.modalExito.classList.add('hidden'));
  elementos.botonCopiarCodigo.addEventListener('click', copiarCodigo);

  elementos.modalReserva.addEventListener('click', (evento) => {
    if (evento.target === elementos.modalReserva) cerrarModalReserva();
  });
  elementos.modalExito.addEventListener('click', (evento) => {
    if (evento.target === elementos.modalExito) elementos.modalExito.classList.add('hidden');
  });

  elementos.formularioConsulta.addEventListener('submit', manejarConsultaReserva);
  elementos.botonConfirmarCancelacion.addEventListener('click', cancelarReserva);
}

async function cargarTodosLosEspacios() {
  mostrarCargandoCatalogo(true);
  try {
    const respuesta = await fetch('/api/spaces');
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error?.message || 'Error al obtener los espacios.');
    }

    estado.espacios = resultado.data || [];
    estado.filtroActivo = null;
    elementos.subtituloCatalogo.textContent = 'Mostrando todos los espacios activos';
    renderizarEspacios(estado.espacios);
  } catch (error) {
    mostrarNotificacion(error.message, 'danger');
  } finally {
    mostrarCargandoCatalogo(false);
  }
}

async function manejarEnvioFiltros(evento) {
  evento.preventDefault();

  const fechaInicio = elementos.filtroFechaInicio.value;
  const fechaFin = elementos.filtroFechaFin.value;
  const capacidad = elementos.filtroCapacidad.value;

  const textoBoton = elementos.botonBuscarDisponibilidad.querySelector('.btn-text');
  const spinner = elementos.botonBuscarDisponibilidad.querySelector('.btn-spinner');

  try {
    textoBoton.textContent = 'Consultando...';
    spinner.classList.remove('hidden');
    elementos.botonBuscarDisponibilidad.disabled = true;

    let url = '/api/spaces';
    const parametros = new URLSearchParams();

    // Si se especifican fechas, consulta disponibilidad con validación de traslapes en el backend
    if (fechaInicio && fechaFin) {
      if (new Date(fechaFin) <= new Date(fechaInicio)) {
        throw new Error('La fecha de fin debe ser posterior a la de inicio.');
      }
      url = '/api/spaces/availability';
      parametros.append('fechaInicio', fechaInicio);
      parametros.append('fechaFin', fechaFin);
    }

    if (capacidad) {
      parametros.append('capacidadMinima', capacidad);
    }

    if ([...parametros.entries()].length > 0) {
      url += `?${parametros.toString()}`;
    }

    mostrarCargandoCatalogo(true);
    const respuesta = await fetch(url);
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error?.message || 'Error al consultar disponibilidad.');
    }

    estado.espacios = resultado.data || [];
    estado.filtroActivo = { fechaInicio, fechaFin, capacidad };

    if (fechaInicio && fechaFin) {
      elementos.subtituloCatalogo.textContent = `Espacios libres entre ${formatearFechaVisual(fechaInicio)} y ${formatearFechaVisual(fechaFin)}`;
    } else if (capacidad) {
      elementos.subtituloCatalogo.textContent = `Espacios con capacidad mínima para ${capacidad} personas`;
    }

    renderizarEspacios(estado.espacios);
  } catch (error) {
    mostrarNotificacion(error.message, 'warning');
  } finally {
    textoBoton.textContent = 'Consultar Disponibilidad';
    spinner.classList.add('hidden');
    elementos.botonBuscarDisponibilidad.disabled = false;
    mostrarCargandoCatalogo(false);
  }
}

function restablecerFiltros() {
  elementos.filtroCapacidad.value = '';
  configurarFechasPorDefecto();
  cargarTodosLosEspacios();
}

function renderizarEspacios(espacios) {
  elementos.cuadriculaEspacios.innerHTML = '';
  elementos.contadorEspacios.textContent = `${espacios.length} ${espacios.length === 1 ? 'espacio' : 'espacios'}`;

  if (espacios.length === 0) {
    elementos.cuadriculaEspacios.classList.add('hidden');
    elementos.catalogoVacio.classList.remove('hidden');
    return;
  }

  elementos.catalogoVacio.classList.add('hidden');
  elementos.cuadriculaEspacios.classList.remove('hidden');

  espacios.forEach((espacio) => {
    const nombre = espacio.nombre || espacio.name;
    const capacidad = espacio.capacidad || espacio.capacity;
    const ubicacion = espacio.ubicacion || espacio.location;

    const tarjeta = document.createElement('article');
    tarjeta.className = 'space-card';
    tarjeta.innerHTML = `
      <div class="space-card-header">
        <h4 class="space-name">${escaparHtml(nombre)}</h4>
        <span class="badge badge-success">Disponible</span>
      </div>
      <div class="space-card-body">
        <div class="space-info-row">
          <span class="detail-label">Capacidad:</span>
          <span>Aforo para <strong>${capacidad}</strong> personas</span>
        </div>
        <div class="space-info-row">
          <span class="detail-label">Ubicación:</span>
          <span>${escaparHtml(ubicacion)}</span>
        </div>
      </div>
      <div class="space-card-footer">
        <button type="button" class="btn btn-primary btn-book" data-space-id="${espacio.id}">
          Reservar Espacio
        </button>
      </div>
    `;

    const botonReservar = tarjeta.querySelector('.btn-book');
    botonReservar.addEventListener('click', () => abrirModalReserva(espacio));

    elementos.cuadriculaEspacios.appendChild(tarjeta);
  });
}

function mostrarCargandoCatalogo(estaCargando) {
  if (estaCargando) {
    elementos.cargandoCatalogo.classList.remove('hidden');
    elementos.cuadriculaEspacios.classList.add('hidden');
    elementos.catalogoVacio.classList.add('hidden');
  } else {
    elementos.cargandoCatalogo.classList.add('hidden');
  }
}

function abrirModalReserva(espacio) {
  const nombre = espacio.nombre || espacio.name;
  const capacidad = espacio.capacidad || espacio.capacity;
  const ubicacion = espacio.ubicacion || espacio.location;

  estado.espacioSeleccionado = espacio;
  elementos.modalIdEspacio.value = espacio.id;
  elementos.modalNombreEspacio.textContent = nombre;
  elementos.modalInfoEspacio.textContent = `Capacidad: ${capacidad} personas | Ubicación: ${ubicacion}`;

  if (elementos.filtroFechaInicio.value) {
    elementos.inicioReserva.value = elementos.filtroFechaInicio.value;
  }
  if (elementos.filtroFechaFin.value) {
    elementos.finReserva.value = elementos.filtroFechaFin.value;
  }

  elementos.alertaModal.classList.add('hidden');
  elementos.alertaModal.textContent = '';
  elementos.modalReserva.classList.remove('hidden');
}

function cerrarModalReserva() {
  elementos.modalReserva.classList.add('hidden');
  elementos.formularioReserva.reset();
  estado.espacioSeleccionado = null;
}

async function manejarEnvioReserva(evento) {
  evento.preventDefault();

  const espacioId = Number(elementos.modalIdEspacio.value);
  const nombreCliente = elementos.nombreCliente.value.trim();
  const correoCliente = elementos.correoCliente.value.trim();
  const fechaInicio = elementos.inicioReserva.value;
  const fechaFin = elementos.finReserva.value;

  if (new Date(fechaFin) <= new Date(fechaInicio)) {
    mostrarAlertaModal('La hora de fin debe ser estrictamente posterior a la hora de inicio.');
    return;
  }

  const textoBoton = elementos.botonConfirmarReserva.querySelector('.btn-text');
  const spinner = elementos.botonConfirmarReserva.querySelector('.btn-spinner');

  try {
    textoBoton.textContent = 'Confirmando...';
    spinner.classList.remove('hidden');
    elementos.botonConfirmarReserva.disabled = true;

    const respuesta = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        espacioId,
        nombreCliente,
        correoCliente,
        fechaInicio,
        fechaFin
      })
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error?.message || 'Error al procesar la reserva.');
    }

    cerrarModalReserva();
    mostrarModalExito(resultado.data);
    mostrarNotificacion('Reserva creada exitosamente', 'success');

    if (estado.filtroActivo?.fechaInicio && estado.filtroActivo?.fechaFin) {
      elementos.formularioFiltros.dispatchEvent(new Event('submit'));
    }
  } catch (error) {
    mostrarAlertaModal(error.message);
  } finally {
    textoBoton.textContent = 'Confirmar Reserva';
    spinner.classList.add('hidden');
    elementos.botonConfirmarReserva.disabled = false;
  }
}

function mostrarAlertaModal(mensaje) {
  elementos.alertaModal.textContent = mensaje;
  elementos.alertaModal.classList.remove('hidden');
}

function mostrarModalExito(reserva) {
  const nombreEspacio = reserva.nombreEspacio || reserva.spaceName;
  const nombreCliente = reserva.nombreCliente || reserva.customerName;
  const correoCliente = reserva.correoCliente || reserva.customerEmail;
  const fechaInicio = reserva.fechaInicio || reserva.startTime;
  const fechaFin = reserva.fechaFin || reserva.endTime;
  const codigo = reserva.codigoCancelacion || reserva.cancellationCode;

  elementos.exitoIdReserva.textContent = reserva.id;
  elementos.exitoNombreEspacio.textContent = nombreEspacio;
  elementos.exitoHorario.textContent = `${formatearFechaVisual(fechaInicio)} — ${formatearFechaVisual(fechaFin)}`;
  elementos.exitoCliente.textContent = `${nombreCliente} (${correoCliente})`;
  elementos.exitoValorCodigo.textContent = codigo;

  elementos.modalExito.classList.remove('hidden');
}

async function copiarCodigo() {
  const codigo = elementos.exitoValorCodigo.textContent;
  try {
    await navigator.clipboard.writeText(codigo);
    elementos.botonCopiarCodigo.textContent = 'Copiado';
    setTimeout(() => {
      elementos.botonCopiarCodigo.textContent = 'Copiar';
    }, 2000);
    mostrarNotificacion('Código copiado al portapapeles', 'info');
  } catch (error) {
    mostrarNotificacion('Selecciona y copia el código manualmente.', 'warning');
  }
}

async function manejarConsultaReserva(evento) {
  evento.preventDefault();

  const idReserva = elementos.inputConsultaId.value.trim();
  const codigoCancelacion = elementos.inputConsultaCodigo.value.trim().toUpperCase();

  const textoBoton = elementos.botonConsultar.querySelector('.btn-text');
  const spinner = elementos.botonConsultar.querySelector('.btn-spinner');

  try {
    textoBoton.textContent = 'Buscando...';
    spinner.classList.remove('hidden');
    elementos.botonConsultar.disabled = true;

    const respuesta = await fetch('/api/reservations/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idReserva: Number(idReserva),
        codigoCancelacion
      })
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error?.message || 'Error al consultar la reserva.');
    }

    estado.reservaConsultada = resultado.data;
    estado.codigoConsultaActual = codigoCancelacion;
    renderizarResultadoConsulta(resultado.data);
    mostrarNotificacion('Reserva encontrada', 'success');
  } catch (error) {
    elementos.resultadoConsulta.classList.add('hidden');
    mostrarNotificacion(error.message, 'danger');
  } finally {
    textoBoton.textContent = 'Consultar Reserva';
    spinner.classList.add('hidden');
    elementos.botonConsultar.disabled = false;
  }
}

function renderizarResultadoConsulta(reserva) {
  const nombreEspacio = reserva.nombreEspacio || reserva.spaceName;
  const ubicacion = reserva.ubicacionEspacio || reserva.spaceLocation;
  const nombreCliente = reserva.nombreCliente || reserva.customerName;
  const correoCliente = reserva.correoCliente || reserva.customerEmail;
  const fechaInicio = reserva.fechaInicio || reserva.startTime;
  const fechaFin = reserva.fechaFin || reserva.endTime;
  const estadoReserva = reserva.estado || reserva.status;

  elementos.detalleId.textContent = reserva.id;
  elementos.detalleEspacio.textContent = nombreEspacio;
  elementos.detalleUbicacion.textContent = ubicacion;
  elementos.detalleCliente.textContent = nombreCliente;
  elementos.detalleCorreo.textContent = correoCliente;
  elementos.detalleInicio.textContent = formatearFechaVisual(fechaInicio);
  elementos.detalleFin.textContent = formatearFechaVisual(fechaFin);

  if (estadoReserva === 'confirmed') {
    elementos.detalleEstadoBadge.className = 'badge badge-success';
    elementos.detalleEstadoBadge.textContent = 'Confirmada';
    elementos.contenedorAccionesCancelacion.classList.remove('hidden');
  } else {
    elementos.detalleEstadoBadge.className = 'badge badge-danger';
    elementos.detalleEstadoBadge.textContent = 'Cancelada';
    elementos.contenedorAccionesCancelacion.classList.add('hidden');
  }

  elementos.resultadoConsulta.classList.remove('hidden');
}

async function cancelarReserva() {
  if (!estado.reservaConsultada || !estado.codigoConsultaActual) return;

  const confirmacion = confirm(
    `¿Estás seguro de que deseas cancelar la reserva #${estado.reservaConsultada.id}? Esta acción liberará el espacio inmediatamente.`
  );
  if (!confirmacion) return;

  const textoBoton = elementos.botonConfirmarCancelacion.querySelector('.btn-text');
  const spinner = elementos.botonConfirmarCancelacion.querySelector('.btn-spinner');

  try {
    textoBoton.textContent = 'Cancelando...';
    spinner.classList.remove('hidden');
    elementos.botonConfirmarCancelacion.disabled = true;

    const respuesta = await fetch(`/api/reservations/${estado.reservaConsultada.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigoCancelacion: estado.codigoConsultaActual })
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error?.message || 'Error al cancelar la reserva.');
    }

    estado.reservaConsultada.estado = 'cancelled';
    estado.reservaConsultada.status = 'cancelled';
    renderizarResultadoConsulta(estado.reservaConsultada);
    mostrarNotificacion('La reserva ha sido cancelada exitosamente.', 'success');

    cargarTodosLosEspacios();
  } catch (error) {
    mostrarNotificacion(error.message, 'danger');
  } finally {
    textoBoton.textContent = 'Cancelar esta Reserva';
    spinner.classList.add('hidden');
    elementos.botonConfirmarCancelacion.disabled = false;
  }
}

function mostrarNotificacion(mensaje, tipo = 'info') {
  const notificacion = document.createElement('div');
  notificacion.className = `toast toast-${tipo}`;
  notificacion.innerHTML = `
    <span>${escaparHtml(mensaje)}</span>
    <button type="button" class="toast-close" aria-label="Cerrar">&times;</button>
  `;

  notificacion.querySelector('.toast-close').addEventListener('click', () => {
    notificacion.remove();
  });

  elementos.contenedorNotificaciones.appendChild(notificacion);

  setTimeout(() => {
    notificacion.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    notificacion.style.opacity = '0';
    notificacion.style.transform = 'translateX(50px)';
    setTimeout(() => notificacion.remove(), 300);
  }, 4500);
}

function formatearFechaVisual(cadenaFecha) {
  if (!cadenaFecha) return '';
  const normalizada = cadenaFecha.includes('T') ? cadenaFecha : cadenaFecha.replace(' ', 'T');
  const fecha = new Date(normalizada);
  if (isNaN(fecha.getTime())) return cadenaFecha;

  return fecha.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Sanitiza cadenas para mitigar vectores XSS al insertar en el DOM
function escaparHtml(texto) {
  if (!texto) return '';
  const mapa = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(texto).replace(/[&<>"']/g, (coincidencia) => mapa[coincidencia]);
}
