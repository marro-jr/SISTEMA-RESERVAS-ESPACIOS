# Sistema Web de Reservas de Espacios Compartidos

Aplicación web completa, robusta y funcional diseñada para la reserva y gestión de espacios compartidos (salas de reuniones, laboratorios de cómputo y cabinas de estudio). Desarrollada como proyecto de portafolio para demostrar fundamentos sólidos de desarrollo web Full Stack, diseño de bases de datos relacionales, manejo de concurrencia en transacciones SQL y consumo de APIs REST con JavaScript moderno nativo.

---

## Tabla de Contenidos

1. [Problema que Resuelve](#problema-que-resuelve)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnologico)
4. [Modelo de Base de Datos (DDL)](#modelo-de-base-de-datos-ddl)
5. [Reglas de Negocio Implementadas](#reglas-de-negocio-implementadas)
6. [Diseño de la API REST](#diseno-de-la-api-rest)
7. [Interfaz de Usuario (Frontend)](#interfaz-de-usuario-frontend)
8. [Instalación y Puesta en Marcha](#instalacion-y-puesta-en-marcha)
9. [Ejecución de Pruebas Automatizadas](#ejecucion-de-pruebas-automatizadas)
10. [Colección Postman](#coleccion-postman)
11. [Decisiones Técnicas y Buenas Prácticas](#decisiones-tecnicas-y-buenas-practicas)
12. [Topología de Ramas (Git Flow)](#topologia-de-ramas-git-flow)

---

## Problema que Resuelve

En entornos universitarios y empresariales, los recursos físicos como salas de trabajo en equipo, laboratorios y cubículos de estudio individuales suelen presentar cuellos de botella por:
- Reservas duplicadas generadas por solicitudes concurrentes o falta de validación en tiempo real.
- Falta de mecanismos sencillos para consultar el estado o cancelar reservas sin forzar al usuario a crear cuentas complejas.
- Falta de visibilidad de los espacios disponibles de acuerdo con la capacidad requerida y el rango horario exacto.

Esta solución ofrece un flujo de reserva ágil con verificación estricta de traslapes en base de datos, código privado de cancelación cifrado y una interfaz responsiva e intuitiva sin dependencias pesadas.

---

## Arquitectura del Sistema

El sistema implementa una arquitectura en capas desacopladas, siguiendo el flujo unidireccional de control:

```
[Navegador Web / Fetch API]
           │
           ▼
    [Express Router]
           │
           ▼
      [Controller]   ── Recibe HTTP, valida formato de entrada, devuelve respuestas y códigos HTTP
           │
           ▼
       [Service]     ── Aplica reglas de negocio, transacciones, generación de hashes y control de concurrencia
           │
           ▼
      [Repository]   ── Ejecuta sentencias SQL parametrizadas con mysql2/promise
           │
           ▼
     [MySQL Database]
```

### Estructura de Directorios

```text
SISTEMA-RESERVAS-ESPACIOS/
├── database/
│   └── schema.sql              # DDL de tablas, índices, restricciones y datos semilla (seed)
├── postman/
│   └── Sistema_Reservas_Espacios.postman_collection.json # Colección completa para pruebas manuales
├── public/                     # Frontend Vanilla (HTML5, CSS3, ES6+)
│   ├── css/
│   │   └── styles.css          # Diseño responsivo y moderno con CSS Variables
│   ├── js/
│   │   └── app.js              # Controlador cliente, llamadas Fetch y manipulación del DOM
│   └── index.html              # Estructura semántica accesible sin dependencias
├── scripts/
│   └── initDb.js               # Script utilitario para crear la BD y cargar el seed automáticamente
├── src/
│   ├── config/
│   │   └── database.js         # Pool de conexiones MySQL con mysql2/promise
│   ├── controllers/
│   │   ├── espacioController.js# Manejador HTTP para espacios
│   │   └── reservaController.js# Manejador HTTP para reservas
│   ├── middlewares/
│   │   └── errorHandler.js     # Manejador centralizado de errores y rutas 404
│   ├── repositories/
│   │   ├── espacioRepository.js# Consultas SQL de espacios y disponibilidad
│   │   └── reservaRepository.js# Consultas SQL de reservas y bloqueo pesimista
│   ├── routes/
│   │   ├── index.js            # Agrupador central de rutas /api
│   │   ├── espacioRoutes.js    # Rutas /api/spaces y /api/espacios
│   │   └── reservaRoutes.js    # Rutas /api/reservations y /api/reservas
│   ├── services/
│   │   ├── espacioService.js   # Reglas de negocio para disponibilidad y espacios
│   │   └── reservaService.js   # Reglas de negocio, cifrado bcrypt y validaciones
│   ├── app.js                  # Configuración de Express, middlewares y estáticos
│   └── server.js               # Punto de entrada y arranque del servidor HTTP
├── tests/
│   └── api.test.js             # Suite de pruebas automatizadas con Jest y Supertest
├── .env.example                # Plantilla de variables de entorno
├── .gitignore                  # Archivos ignorados por Git
├── package.json                # Dependencias y scripts de npm
└── README.md                   # Documentación técnica completa
```

---

## Stack Tecnológico

### Frontend
- HTML5 semántico: Estructura accesible (`<header>`, `<main>`, `<section>`, `<article>`, diálogos).
- CSS3 moderno: Flexbox, CSS Grid, variables personalizadas, animaciones de carga y media queries responsivas.
- JavaScript (ES6+): Promesas, Async/Await, Fetch API, manipulación nativa del DOM y sanitización XSS.

### Backend
- Node.js: Entorno de ejecución en servidor.
- Express 5: Framework web minimalista para APIs REST.
- MySQL 8.0: Motor de base de datos relacional con soporte transaccional ACID (InnoDB).
- mysql2/promise: Driver de alto rendimiento con soporte nativo de Promises y consultas preparadas (previene SQL Injection).
- bcryptjs: Hash criptográfico seguro con salt para proteger el código privado de cancelación.

### Calidad y Pruebas
- Jest: Marco de pruebas unitarias y de integración.
- Supertest: Simulación y pruebas de endpoints HTTP.
- Postman: Documentación ejecutable de la API.

---

## Modelo de Base de Datos (DDL)

El diseño relacional se compone de dos tablas con integridad referencial, índices compuestos y restricciones de verificación (`CHECK`):

### 1. Tabla `spaces` (Espacios físicos)
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INT AUTO_INCREMENT | PRIMARY KEY | Identificador único del espacio |
| `name` | VARCHAR(100) | NOT NULL | Nombre descriptivo del espacio |
| `capacity` | INT | NOT NULL, CHECK (capacity > 0) | Aforo máximo de personas |
| `location` | VARCHAR(150) | NOT NULL | Ubicación física (piso, pabellón) |
| `active` | TINYINT(1) | NOT NULL DEFAULT 1 | 1 = Activo, 0 = Inactivo |
| `created_at` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | Fecha de creación del registro |

Índice: `idx_spaces_active_capacity (active, capacity)` para consultas de filtrado rápido.

### 2. Tabla `reservations` (Reservas)
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INT AUTO_INCREMENT | PRIMARY KEY | Identificador único de la reserva |
| `space_id` | INT | NOT NULL, FK a `spaces(id)` ON DELETE RESTRICT | Espacio reservado |
| `customer_name` | VARCHAR(100) | NOT NULL | Nombre completo del titular |
| `customer_email` | VARCHAR(150) | NOT NULL | Correo de contacto |
| `start_time` | DATETIME | NOT NULL | Fecha y hora de inicio |
| `end_time` | DATETIME | NOT NULL, CHECK (end_time > start_time) | Fecha y hora de culminación |
| `status` | ENUM('confirmed', 'cancelled') | NOT NULL DEFAULT 'confirmed' | Estado actual |
| `cancellation_code_hash` | VARCHAR(255) | NOT NULL | Hash con bcrypt del código secreto |
| `created_at` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | Fecha de registro |

Índice: `idx_reservations_overlap (space_id, status, start_time, end_time)` para verificar traslapes en tiempo logarítmico.

---

## Reglas de Negocio Implementadas

1. Espacios Inactivos: No se permite crear reservas en espacios inactivos. El servidor responde `400 Bad Request`.
2. Consistencia Temporal:
   - `end_time` debe ser estrictamente posterior a `start_time`.
   - No se permiten reservas en fechas u horarios pasados (con tolerancia de 2 minutos para desfase de reloj).
3. No Superposición de Horarios (Overlapping):
   - Dos reservas para el mismo espacio colisionan si:
     $$\text{reservaExistente.inicio} < \text{nuevaReserva.fin} \quad \land \quad \text{reservaExistente.fin} > \text{nuevaReserva.inicio}$$
   - Si existe una reserva con `status = 'confirmed'` en dicho intervalo, se rechaza con `409 Conflict`.
4. Control de Concurrencia y Bloqueo Pesimista (Race Conditions):
   - Al registrar una reserva, se ejecuta una transacción MySQL con `SELECT ... FOR UPDATE` sobre el espacio y las reservas existentes del mismo intervalo.
   - Si dos clientes envían solicitudes exactamente al mismo instante para el mismo espacio, una solicitud adquiere el bloqueo, confirma la reserva y la segunda es rechazada con `409 Conflict`.
5. Liberación por Cancelación:
   - Una reserva cancelada (`status = 'cancelled'`) libera inmediatamente el espacio para que otros usuarios puedan reservarlo.
6. Idempotencia y Cancelación Atómica Condicional:
   - No es posible cancelar una reserva dos veces (retorna `409 Conflict`).
   - Se utiliza una actualización SQL atómica y condicional:
     `UPDATE reservations SET status = 'cancelled' WHERE id = ? AND status = 'confirmed'`
     evaluando las filas afectadas (`affectedRows`).
   - Si dos solicitudes concurrentes intentan cancelar la misma reserva a la vez, exactamente una actualiza el registro (`affectedRows === 1`, responde `200 OK`) y la segunda es rechazada (`affectedRows === 0`, responde `409 Conflict`), previniendo condiciones de carrera sin dependencias adicionales.
7. Código Privado Seguro con Entropía de 128 Bits:
   - Se genera un identificador aleatorio criptográficamente seguro de 128 bits mediante `crypto.randomBytes(16).toString('hex')` (cadena hexadecimal de 32 caracteres).
   - El código se devuelve al cliente únicamente una vez al crear la reserva y se adapta limpiamente en la interfaz de usuario.
   - En la base de datos se almacena exclusivamente su hash unidireccional generado mediante `bcryptjs` con 10 rondas de salt.
   - Para consultar los datos o cancelar la reserva, el usuario debe presentar dicho código privado.
8. Mitigación contra Ataques de Fuerza Bruta (Rate Limiting):
   - Los endpoints sensibles de consulta y cancelación (`/api/reservations/lookup` y `/api/reservations/:id/cancel`) están protegidos contra intentos reiterados de adivinanza de códigos mediante un middleware de limitación de tasa en memoria.
   - Ante ráfagas continuas de solicitudes provenientes de una misma IP, el servidor responde `429 Too Many Requests`.

---

## Diseño de la API REST

### Resumen de Endpoints

| Método | Endpoint | Descripción | Códigos HTTP |
|---|---|---|---|
| `GET` | `/api/spaces` (ó `/api/espacios`) | Lista espacios activos (permite `?minCapacity=N`) | `200`, `500` |
| `GET` | `/api/spaces/availability` | Consulta espacios libres según rango horario y capacidad | `200`, `400`, `500` |
| `GET` | `/api/spaces/:id` | Retorna el detalle de un espacio físico | `200`, `400`, `404`, `500` |
| `POST` | `/api/reservations` (ó `/api/reservas`) | Registra una nueva reserva | `201`, `400`, `404`, `409`, `500` |
| `POST` | `/api/reservations/lookup` | Consulta datos de reserva exigiendo el código privado | `200`, `400`, `401`, `404`, `500` |
| `POST` | `/api/reservations/:id/cancel`| Cancela la reserva con su código privado | `200`, `400`, `401`, `404`, `409`, `500` |

---

## Interfaz de Usuario (Frontend)

El frontend está compuesto por una vista limpia, responsiva y dividida en 3 flujos claros:

1. Buscador y Filtro de Disponibilidad:
   - Selección de fecha/hora de inicio y fin.
   - Filtro numérico por aforo/capacidad mínima.
   - Estado de carga reactivo y botón para restaurar el catálogo completo.
2. Catálogo de Espacios y Reserva:
   - Cuadrícula de tarjetas con nombre, aforo, ubicación y distintivo de estado.
   - Modal interactivo de reserva que valida los campos y envía la solicitud a la API.
   - Modal de confirmación con destacado del código privado de cancelación y botón de copiado rápido al portapapeles.
3. Módulo de Consulta y Cancelación:
   - Formulario para ingresar el ID de la reserva y su código privado.
   - Tarjeta informativa con los detalles de la reserva sin exponer hashes sensibles.
   - Botón de cancelación inmediata con confirmación del usuario y notificación toast.

---

## Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js (v18 o superior).
- MySQL Server (8.0 o superior) en ejecución.

### Pasos de Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/marro-jr/SISTEMA-RESERVAS-ESPACIOS.git
   cd SISTEMA-RESERVAS-ESPACIOS
   ```

2. Instalar dependencias del proyecto:
   ```bash
   npm install
   ```

3. Configurar las variables de entorno:
   Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   Edita `.env` con las credenciales de tu servidor MySQL local:
   ```env
   PORT=3000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=sistema_reservas
   DB_NAME_TEST=sistema_reservas_test
   ```

4. Inicializar y poblar la Base de Datos:
   Ejecuta el script automatizado para crear la base de datos de desarrollo, tablas, restricciones e insertar los datos semilla (seed):
   ```bash
   npm run db:init
   ```

   *(Opcional) Si deseas inicializar manualmente la base de datos de pruebas:*
   ```bash
   npm run db:init -- --test
   ```

5. Iniciar la aplicación:
   - Modo Producción:
     ```bash
     npm start
     ```
   - Modo Desarrollo (con recarga automática):
     ```bash
     npm run dev
     ```

6. Abrir en el Navegador:
   - Interfaz Web: `http://localhost:3000`
   - API REST: `http://localhost:3000/api/spaces`

---

## Ejecución de Pruebas Automatizadas

El proyecto cuenta con una batería de pruebas de integración desarrolladas con Jest y Supertest que verifican el cumplimiento de cada regla de negocio, la resistencia a condiciones de carrera y la seguridad de los endpoints.

### Aislamiento Estricto de Base de Datos para Pruebas
Las pruebas se ejecutan obligatoriamente sobre una base de datos MySQL exclusiva (`sistema_reservas_test`). La configuración del pool de conexiones (`src/config/database.js`) valida activamente que el entorno sea de pruebas (`NODE_ENV === 'test'`) y restringe las operaciones de limpieza y descarte de registros exclusivamente a dicha base, impidiendo cualquier ejecución destructiva o accidental sobre bases de datos de desarrollo o producción.

El comando de prueba inicializa automáticamente el esquema de la base de pruebas antes de lanzar Jest:

```bash
npm test
```

### Casos de Prueba Verificados (17 pruebas automatizadas)
- Listado de espacios activos y exclusión de espacios en mantenimiento.
- Filtro de espacios por capacidad mínima.
- Consulta de disponibilidad en rangos de fecha y hora.
- Creación de reserva exitosa con emisión de código privado seguro de 128 bits (32 caracteres hexadecimales) y respuesta `201 Created`.
- Rechazo de reservas con horarios superpuestos (`409 Conflict`).
- Rechazo de fechas con hora fin anterior a la de inicio (`400 Bad Request`).
- Rechazo de reservas en fechas pasadas (`400 Bad Request`).
- Rechazo de reserva en espacios inexistentes (`404 Not Found`).
- Rechazo de reserva en espacios inactivos (`400 Bad Request`).
- Consulta de reserva mediante código privado sin revelar el hash (`200 OK`).
- Rechazo de consulta con código de cancelación erróneo (`401 Unauthorized`).
- Rechazo de intento de cancelación con código incorrecto (`401 Unauthorized`).
- Cancelación exitosa de reserva y liberación del espacio para nuevas reservas (`200 OK`).
- Rechazo de intento de cancelar dos veces la misma reserva (`409 Conflict`).
- Concurrencia en Reservas: Dos solicitudes simultáneas disparadas en paralelo (`Promise.all`) para el mismo espacio y horario; se valida que exactamente una responde `201 Created` y la otra `409 Conflict`, evitando reservas incompatibles.
- Concurrencia en Cancelaciones: Dos solicitudes simultáneas disparadas en paralelo para cancelar la misma reserva; se valida mediante actualización condicional que exactamente una responde `200 OK` y la otra `409 Conflict`.
- Mitigación de Fuerza Bruta (Rate Limiting): Se comprueba que ante ráfagas consecutivas de solicitudes en endpoints sensibles, el sistema bloquea con `429 Too Many Requests`.

---

## Colección Postman

En la carpeta `postman/` se encuentra el archivo:
- `Sistema_Reservas_Espacios.postman_collection.json`

Permite importar y ejecutar todos los endpoints de prueba tanto para espacios como para reservas, con guardado automático de variables de entorno para consultar y cancelar la reserva creada.

---

## Decisiones Técnicas y Buenas Prácticas

1. Arquitectura por Capas sin Sobreingeniería:
   - Se estructuró el backend en `routes -> controllers -> services -> repositories` con nombres en español y sufijos estándar (`espacioController`, `reservaController`, `espacioService`, `reservaService`, `espacioRepository`, `reservaRepository`).
2. Consultas SQL Parametrizadas:
   - Todas las sentencias utilizan marcadores de posición `?` mediante `mysql2/promise`, eliminando completamente vulnerabilidades de inyección SQL (SQLi).
3. Transacciones y Bloqueo Pesimista (Pessimistic Locking):
   - Se utilizaron transacciones nativas de MySQL InnoDB con cláusula `FOR UPDATE`. Esto asegura consistencia estricta (ACID) y serialización segura de reservas concurrentes.
4. Cancelación Condicional Atómica:
   - Para evitar condiciones de carrera en cancelaciones paralelas sin requerir bloqueos pesados de tabla, se utiliza `UPDATE reservations SET status = 'cancelled' WHERE id = ? AND status = 'confirmed'` y se verifican las filas afectadas (`affectedRows`).
5. Seguridad Criptográfica de 128 Bits:
   - Los códigos de cancelación se generan con `crypto.randomBytes(16).toString('hex')` (32 caracteres hexadecimales, 128 bits de entropía). En base de datos solo se persiste su hash unidireccional con `bcryptjs` (salt 10).
6. Protección contra Fuerza Bruta (Rate Limiting):
   - Middleware liviano en memoria que calcula ventanas deslizantes por IP para endpoints sensibles de consulta y cancelación, respondiendo `429 Too Many Requests` ante abusos sin recurrir a dependencias externas.
7. Separación y Seguridad de Entornos de Base de Datos:
   - Las pruebas automáticas operan contra una base de datos aislada (`sistema_reservas_test`) protegida con salvaguardas que bloquean la ejecución destructiva en bases de datos de desarrollo o producción.
8. Manejo Centralizado de Errores:
   - Se implementó un middleware central que captura cualquier excepción no controlada o error de negocio con su respectivo código de estado HTTP (`400`, `401`, `404`, `409`, `500`).
9. Frontend Ligero y Accesible:
   - Se utilizó HTML5 semántico y CSS3 puro con variables y componentes responsivos, adaptando el diseño para desplegar códigos de 32 caracteres con ajuste de línea fluido.

---

## Topología de Ramas (Git Flow)

Para el versionamiento profesional del proyecto se recomienda la topología estándar de Git Flow:

- `main`: Código probado y listo para producción.
- `develop`: Rama integradora de desarrollo.
- `feature/*`: Ramas de trabajo para funcionalidades específicas.
- `release/*`: Preparación y verificación previa al pase a producción.
