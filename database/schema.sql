DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS spaces;

CREATE TABLE spaces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  location VARCHAR(150) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_spaces_capacity CHECK (capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optimiza filtros combinados por estado y capacidad mínima
CREATE INDEX idx_spaces_active_capacity ON spaces (active, capacity);

CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  space_id INT NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(150) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  cancellation_code_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_reservations_space
    FOREIGN KEY (space_id) REFERENCES spaces (id)
    ON DELETE RESTRICT 
    ON UPDATE CASCADE,

  CONSTRAINT chk_reservations_time CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índice para acelerar la detección de traslapes en consultas con bloqueo pesimista
CREATE INDEX idx_reservations_overlap ON reservations (space_id, status, start_time, end_time);
CREATE INDEX idx_reservations_email ON reservations (customer_email);

INSERT INTO spaces (id, name, capacity, location, active) VALUES
(1, 'Sala Innovación Tecnológica', 12, 'Edificio Central - Piso 3 (Sala 301)', 1),
(2, 'Laboratorio de Software y Redes', 20, 'Pabellón de Ingeniería - Piso 2 (Lab 204)', 1),
(3, 'Sala Ágora para Reuniones', 8, 'Edificio Administrativo - Piso 1 (Sala 102)', 1),
(4, 'Cabina de Estudio Focus A', 2, 'Biblioteca Central - Ala Norte', 1),
(5, 'Cabina de Estudio Focus B', 4, 'Biblioteca Central - Ala Sur', 1),
(6, 'Auditorio de Conferencias (En Mantenimiento)', 35, 'Pabellón A - Auditorio Principal', 0);

ALTER TABLE spaces AUTO_INCREMENT = 7;
