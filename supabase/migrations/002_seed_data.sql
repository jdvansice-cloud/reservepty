-- ============================================================================
-- ReservePTY Seed Data v1.0.0
-- Development & Testing Data
-- ============================================================================
-- Run this after the initial schema migration
-- ============================================================================

-- ============================================================================
-- AIRPORTS (Major Panama & Latin America airports + helipads)
-- ============================================================================

INSERT INTO airports (icao_code, iata_code, name, city, country, latitude, longitude, timezone, type) VALUES
-- Panama
('MPTO', 'PTY', 'Tocumen International Airport', 'Panama City', 'Panama', 9.0714, -79.3835, 'America/Panama', 'airport'),
('MPPA', 'PAC', 'Marcos A. Gelabert International Airport', 'Panama City', 'Panama', 8.9733, -79.5556, 'America/Panama', 'airport'),
('MPDA', 'DAV', 'Enrique Malek International Airport', 'David', 'Panama', 8.3910, -82.4350, 'America/Panama', 'airport'),
('MPBO', 'BOC', 'Bocas del Toro Airport', 'Bocas del Toro', 'Panama', 9.3408, -82.2508, 'America/Panama', 'airport'),
('MPHO', 'CHX', 'Cap Manuel Niño International Airport', 'Changuinola', 'Panama', 9.4587, -82.5168, 'America/Panama', 'airport'),
('MPCE', NULL, 'Contadora Airport', 'Contadora Island', 'Panama', 8.6286, -79.0347, 'America/Panama', 'airport'),
('MPSA', NULL, 'San Blas Airport', 'San Blas', 'Panama', 9.3333, -78.5833, 'America/Panama', 'airport'),

-- Central America
('MROC', 'SJO', 'Juan Santamaría International Airport', 'San José', 'Costa Rica', 9.9939, -84.2088, 'America/Costa_Rica', 'airport'),
('MRLB', 'LIR', 'Daniel Oduber Quirós International Airport', 'Liberia', 'Costa Rica', 10.5933, -85.5444, 'America/Costa_Rica', 'airport'),
('MGGT', 'GUA', 'La Aurora International Airport', 'Guatemala City', 'Guatemala', 14.5833, -90.5275, 'America/Guatemala', 'airport'),
('MSLP', 'SAL', 'Monseñor Óscar Arnulfo Romero International Airport', 'San Salvador', 'El Salvador', 13.4409, -89.0557, 'America/El_Salvador', 'airport'),

-- South America
('SKBO', 'BOG', 'El Dorado International Airport', 'Bogotá', 'Colombia', 4.7016, -74.1469, 'America/Bogota', 'airport'),
('SKCG', 'CTG', 'Rafael Núñez International Airport', 'Cartagena', 'Colombia', 10.4424, -75.5130, 'America/Bogota', 'airport'),
('SEQM', 'UIO', 'Mariscal Sucre International Airport', 'Quito', 'Ecuador', -0.1292, -78.3575, 'America/Guayaquil', 'airport'),
('SPJC', 'LIM', 'Jorge Chávez International Airport', 'Lima', 'Peru', -12.0219, -77.1143, 'America/Lima', 'airport'),

-- Caribbean
('MDSD', 'SDQ', 'Las Américas International Airport', 'Santo Domingo', 'Dominican Republic', 18.4296, -69.6689, 'America/Santo_Domingo', 'airport'),
('MDPC', 'PUJ', 'Punta Cana International Airport', 'Punta Cana', 'Dominican Republic', 18.5674, -68.3634, 'America/Santo_Domingo', 'airport'),
('MKJP', 'KIN', 'Norman Manley International Airport', 'Kingston', 'Jamaica', 17.9357, -76.7875, 'America/Jamaica', 'airport'),
('TNCM', 'SXM', 'Princess Juliana International Airport', 'Sint Maarten', 'Sint Maarten', 18.0410, -63.1089, 'America/Lower_Princes', 'airport'),

-- USA (nearby)
('KMIA', 'MIA', 'Miami International Airport', 'Miami', 'USA', 25.7959, -80.2870, 'America/New_York', 'airport'),
('KFLL', 'FLL', 'Fort Lauderdale-Hollywood International Airport', 'Fort Lauderdale', 'USA', 26.0726, -80.1527, 'America/New_York', 'airport'),
('KEYW', 'EYW', 'Key West International Airport', 'Key West', 'USA', 24.5561, -81.7595, 'America/New_York', 'airport'),

-- Mexico
('MMMX', 'MEX', 'Mexico City International Airport', 'Mexico City', 'Mexico', 19.4363, -99.0721, 'America/Mexico_City', 'airport'),
('MMUN', 'CUN', 'Cancún International Airport', 'Cancún', 'Mexico', 21.0365, -86.8771, 'America/Cancun', 'airport'),

-- Helipads (sample)
('HPAN1', NULL, 'Panama City Downtown Helipad', 'Panama City', 'Panama', 8.9824, -79.5199, 'America/Panama', 'helipad'),
('HPAN2', NULL, 'Hotel Las Americas Helipad', 'Panama City', 'Panama', 9.0012, -79.4856, 'America/Panama', 'helipad'),
('HPAN3', NULL, 'Boquete Highland Helipad', 'Boquete', 'Panama', 8.7806, -82.4350, 'America/Panama', 'helipad'),
('HCOL1', NULL, 'Cartagena Private Helipad', 'Cartagena', 'Colombia', 10.4232, -75.5479, 'America/Bogota', 'helipad'),
('HCRC1', NULL, 'San José Private Helipad', 'San José', 'Costa Rica', 9.9281, -84.0907, 'America/Costa_Rica', 'helipad');

-- ============================================================================
-- PORTS (Major Panama & Caribbean ports)
-- ============================================================================

INSERT INTO ports (code, name, city, country, latitude, longitude, timezone) VALUES
-- Panama
('PAPTY', 'Flamenco Marina', 'Panama City', 'Panama', 8.9131, -79.5331, 'America/Panama'),
('PAPSC', 'Panama Yacht Club', 'Panama City', 'Panama', 8.9514, -79.5478, 'America/Panama'),
('PABDT', 'Bocas del Toro Marina', 'Bocas del Toro', 'Panama', 9.3407, -82.2426, 'America/Panama'),
('PACNT', 'Contadora Marina', 'Contadora Island', 'Panama', 8.6261, -79.0336, 'America/Panama'),
('PAPRT', 'Portobelo Marina', 'Portobelo', 'Panama', 9.5547, -79.6536, 'America/Panama'),
('PALIN', 'Linton Bay Marina', 'Colón', 'Panama', 9.4358, -79.6539, 'America/Panama'),
('PASBL', 'San Blas Islands', 'San Blas', 'Panama', 9.4514, -78.8231, 'America/Panama'),
('PABQT', 'Boquete Marina', 'Boquete', 'Panama', 8.6469, -82.6317, 'America/Panama'),
('PATAB', 'Taboga Island Marina', 'Taboga', 'Panama', 8.7847, -79.5558, 'America/Panama'),

-- Colombia
('COCTG', 'Club de Pesca Cartagena', 'Cartagena', 'Colombia', 10.4000, -75.5500, 'America/Bogota'),
('COSMA', 'Santa Marta Marina', 'Santa Marta', 'Colombia', 11.2472, -74.2125, 'America/Bogota'),

-- Costa Rica
('CRPUN', 'Puntarenas Marina', 'Puntarenas', 'Costa Rica', 9.9763, -84.8433, 'America/Costa_Rica'),
('CRGOL', 'Marina Papagayo', 'Gulf of Papagayo', 'Costa Rica', 10.6639, -85.7008, 'America/Costa_Rica'),
('CRLOS', 'Los Sueños Marina', 'Herradura', 'Costa Rica', 9.6439, -84.6547, 'America/Costa_Rica'),

-- Caribbean
('DOSDO', 'Casa de Campo Marina', 'La Romana', 'Dominican Republic', 18.4167, -68.9667, 'America/Santo_Domingo'),
('DOPCN', 'Puerto Cana Marina', 'Punta Cana', 'Dominican Republic', 18.5833, -68.3667, 'America/Santo_Domingo'),
('JMKIN', 'Port Antonio Marina', 'Port Antonio', 'Jamaica', 18.1819, -76.4503, 'America/Jamaica'),
('SXMPH', 'Simpson Bay Marina', 'Sint Maarten', 'Sint Maarten', 18.0375, -63.0969, 'America/Lower_Princes'),

-- USA
('USMIA', 'Miami Beach Marina', 'Miami', 'USA', 25.7689, -80.1325, 'America/New_York'),
('USFLL', 'Bahia Mar Marina', 'Fort Lauderdale', 'USA', 26.1081, -80.1078, 'America/New_York'),
('USKEY', 'Key West Bight Marina', 'Key West', 'USA', 24.5622, -81.8017, 'America/New_York');

-- ============================================================================
-- DEVELOPMENT: Create a test platform admin
-- ============================================================================
-- Note: First create a user through Supabase Auth, then run:
-- 
-- INSERT INTO platform_admins (user_id, role)
-- SELECT id, 'super_admin' FROM profiles WHERE email = 'admin@reservepty.com';

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
