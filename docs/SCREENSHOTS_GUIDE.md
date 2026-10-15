# Guía de Capturas de Pantalla para el Portafolio

Esta guía detalla las capturas de pantalla recomendadas para ilustrar el proyecto en tu portafolio personal, LinkedIn o presentación técnica.

---

## 📸 Capturas Recomendadas y Cómo Obtenerlas

### 1. Vista Principal con Catálogo de Espacios (`screenshot-catalog.png`)
- **Ruta:** `http://localhost:3000`
- **Contenido a mostrar:**
  - Barra de navegación y título ("ReservaEspacios").
  - Formulario de filtros de fecha y aforo.
  - La cuadrícula con las tarjetas de los espacios activos (Sala Innovación, Laboratorio de Redes, Cabinas Focus, etc.) mostrando sus aforos y ubicaciones.

---

### 2. Formulario Modal de Creación de Reserva (`screenshot-booking-modal.png`)
- **Acción:** Haz clic en el botón **"Reservar Espacio"** de cualquiera de las salas.
- **Contenido a mostrar:**
  - El modal abierto con el resumen del espacio seleccionado.
  - Formulario con campos de Nombre completo, Correo electrónico, Inicio y Fin de la reserva.

---

### 3. Confirmación Exitosa y Código Privado (`screenshot-success-modal.png`)
- **Acción:** Completa una reserva y haz clic en **"Confirmar Reserva"**.
- **Contenido a mostrar:**
  - El modal de éxito con el ícono de verificación verde.
  - El recuadro destacado con el **Código Privado de Cancelación** (ej. `CAN-XXXX-XXXX`) y el botón para copiar al portapapeles.

---

### 4. Búsqueda y Filtro de Disponibilidad (`screenshot-availability-filter.png`)
- **Acción:** Ingresa un horario específico y una capacidad mínima (ej. 10 personas) y haz clic en **"Consultar Disponibilidad"**.
- **Contenido a mostrar:**
  - El catálogo filtrado mostrando únicamente las salas que cumplen los criterios y no tienen traslapes de horario.
  - El subtítulo que indica el intervalo consultado y el contador de espacios disponibles.

---

### 5. Consulta y Cancelación de Reserva (`screenshot-lookup-cancel.png`)
- **Acción:** Desplázate a la sección inferior **"Gestionar Reserva"**, ingresa el ID de la reserva y el código privado obtenido en el paso 3, y haz clic en **"Consultar Reserva"**.
- **Contenido a mostrar:**
  - La tarjeta con los datos de la reserva consultada (Espacio, Titular, Horarios y badge verde "Confirmada").
  - El botón rojo **"Cancelar esta Reserva"**.

---

### 6. Ejecución de Pruebas Automatizadas y Concurrencia (`screenshot-tests.png`)
- **Acción:** Abre una terminal en la raíz del proyecto y ejecuta:
  ```bash
  npm test
  ```
- **Contenido a mostrar:**
  - La salida de Jest en la consola con los 15 tests en verde (`PASS tests/api.test.js`), destacando la prueba de concurrencia y prevención de doble reserva.

---

## 🛠 Herramientas Sugeridas para Capturar
- **Windows Snipping Tool:** Presiona `Windows + Shift + S` para seleccionar el área deseada.
- **Chrome / Edge DevTools:** Presiona `F12` o `Ctrl + Shift + I`, luego `Ctrl + Shift + P` y escribe `"Capture full size screenshot"` para capturar la página web completa en alta resolución.
