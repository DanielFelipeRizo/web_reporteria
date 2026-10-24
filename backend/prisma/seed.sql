-- Datos iniciales para desarrollo local (los datos de la BD original no están en el repo).
-- Ejecutar con: npm run db:seed
-- Se puede correr varias veces: catálogos y seguridad no se duplican, y los datos
-- demo (UUID con prefijo 'de000000-') se borran y se vuelven a crear.

BEGIN;

-- ── Seguridad ────────────────────────────────────────────────────────────────
-- UsersService considera administrador a quien pertenezca al grupo 1.
INSERT INTO "sec_groups" ("group_id", "description") VALUES
  (1, 'Administrator'),
  (2, 'Consulta')
ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('"sec_groups"', 'group_id'), (SELECT MAX("group_id") FROM "sec_groups"));

-- Mismos módulos que SYSTEM_MODULES en apps.service.ts
INSERT INTO "sec_apps" ("app_name", "app_type", "description") VALUES
  ('ventas',                 'module',   'Módulo de Ventas/Transacciones'),
  ('cierres',                'module',   'Módulo de Cierres'),
  ('reservas',               'module',   'Módulo de Reservas'),
  ('seguridad.usuarios',     'security', 'Gestión de Usuarios'),
  ('seguridad.roles',        'security', 'Gestión de Roles'),
  ('seguridad.aplicaciones', 'security', 'Gestión de Módulos/Aplicaciones'),
  ('seguridad.auditoria',    'security', 'Auditoría del sistema')
ON CONFLICT DO NOTHING;

INSERT INTO "sec_groups_apps"
  ("group_id", "app_name", "priv_access", "priv_insert", "priv_delete", "priv_update", "priv_export", "priv_print")
SELECT 1, "app_name", 'Y', 'Y', 'Y', 'Y', 'Y', 'Y' FROM "sec_apps"
ON CONFLICT DO NOTHING;

INSERT INTO "sec_groups_apps"
  ("group_id", "app_name", "priv_access", "priv_insert", "priv_delete", "priv_update", "priv_export", "priv_print")
SELECT 2, "app_name", 'Y', 'N', 'N', 'N', 'Y', 'Y' FROM "sec_apps" WHERE "app_name" IN ('ventas', 'cierres')
ON CONFLICT DO NOTHING;

-- Hashes bcrypt (costo 12) de 'admin123' y 'consulta123', el formato de common/utils/password.ts
INSERT INTO "sec_users"
  ("login", "pswd", "name", "email", "usr_active", "priv_admin", "usr_intentos", "UsuarioAlta", "FechaAlta")
VALUES
  ('admin',    '$2b$12$xaHs68/bmnU7pk/1AF66jOwkWIQiWNZujUDkcIgcMO8dtI9A7MgrK', 'Administrador',    'admin@demo.test',    'Y', 'Y', 0, 'seed', now()),
  ('consulta', '$2b$12$yFCzzSjCNY5I10hg85KSTu1QL/RvhkozBi05HlI5tWKKBHKvDQ/ZS', 'Usuario Consulta', 'consulta@demo.test', 'Y', 'N', 0, 'seed', now())
ON CONFLICT DO NOTHING;

INSERT INTO "sec_users_groups" ("login", "group_id") VALUES
  ('admin', 1),
  ('consulta', 2)
ON CONFLICT DO NOTHING;

-- ── Catálogos ────────────────────────────────────────────────────────────────
-- Los valores son de ejemplo: los reales estaban en la BD original.
INSERT INTO "ModeloTerminal" ("model_id", "model_descripcion") VALUES
  (1, 'NEW9220'),
  (2, 'A920PRO'),
  (3, 'N910')
ON CONFLICT DO NOTHING;

INSERT INTO "TypeTransaction" ("Transact_id", "Transact_descripcion") VALUES
  (1, 'VENTA'),
  (2, 'ANULACION'),
  (3, 'DEVOLUCION')
ON CONFLICT DO NOTHING;

INSERT INTO "TypeRead" ("Read_id", "Read_descripcion") VALUES
  (1, 'CHIP'),
  (2, 'BANDA'),
  (3, 'CONTACTLESS'),
  (4, 'MANUAL')
ON CONFLICT DO NOTHING;

-- Client.Tipo_Envio usa 6 por defecto, así que ese id tiene que existir.
INSERT INTO "tipo_envio" ("id", "descripcion") VALUES
  (1, 'EMAIL'),
  (2, 'SMS'),
  (3, 'WHATSAPP'),
  (6, 'SIN ENVIO')
ON CONFLICT DO NOTHING;

-- Filtro "Tipo de transacción" de Ventas (10 = ventas QR de TransactionQr)
INSERT INTO "TypeTransacionModel" ("transacId", "descripcion", "modeloTerminal")
SELECT t.id, t.descripcion, m."model_descripcion"
FROM (VALUES (1, 'VENTA'), (2, 'ANULACION'), (3, 'DEVOLUCION'), (10, 'VENTA QR')) AS t(id, descripcion)
CROSS JOIN "ModeloTerminal" m
WHERE NOT EXISTS (
  SELECT 1 FROM "TypeTransacionModel" x
  WHERE x."transacId" = t.id AND x."modeloTerminal" = m."model_descripcion"
);

-- Filtro "Tipo de transacción" de Cierres (se compara con Cierre_TypeTrx)
INSERT INTO "TypeCierre" ("id_transac", "descripcion", "modeloTerminal")
SELECT t.id, t.descripcion, m."model_descripcion"
FROM (VALUES (1, 'CIERRE DE LOTE'), (2, 'CIERRE PARCIAL')) AS t(id, descripcion)
CROSS JOIN "ModeloTerminal" m
WHERE NOT EXISTS (
  SELECT 1 FROM "TypeCierre" x
  WHERE x."id_transac" = t.id AND x."modeloTerminal" = m."model_descripcion"
);

-- ── Datos demo ───────────────────────────────────────────────────────────────
-- Cada venta guarda su propia copia del comercio (Merchants) y del cliente
-- (Client) unida por UUID, igual que en las consultas de ventas.service.ts.
DELETE FROM "Transactions"      WHERE "Transac_UUID"  LIKE 'de000000-%';
DELETE FROM "TransactionQr"     WHERE "Uuid"          LIKE 'de000000-%';
DELETE FROM "Client"            WHERE "Client_UUID"   LIKE 'de000000-%';
DELETE FROM "Merchants"         WHERE "merchant_UUID" LIKE 'de000000-%';
DELETE FROM "htmls_merchants"   WHERE "UUID"          LIKE 'de000000-%';
DELETE FROM "CierreTransaccion" WHERE "Cierre_UUID"   LIKE 'de000000-%';

CREATE TEMP TABLE demo_comercio (
  idx int, nombre text, ciudad text, direccion text, telefono text,
  mid text, tid text, modelo text, email text
) ON COMMIT DROP;

INSERT INTO demo_comercio VALUES
  (0, 'Farmacia San Jorge',    'La Paz',     'Av. Arce 2345',      '22441122', '000000101', 'TID00101', 'NEW9220', 'farmacia@demo.test'),
  (1, 'Supermercado El Prado', 'Santa Cruz', 'Calle Libertad 120', '33345566', '000000102', 'TID00102', 'A920PRO', 'super@demo.test'),
  (2, 'Restaurante Illimani',  'Cochabamba', 'Av. Ballivián 789',  '44256677', '000000103', 'TID00103', 'N910',    'resto@demo.test');

-- 60 ventas con tarjeta (n 1-60) y 10 con QR (n 61-70) en los últimos 30 días.
-- El lote cambia cada semana: 000050 es el lote abierto de la semana actual.
CREATE TEMP TABLE demo_venta ON COMMIT DROP AS
SELECT
  g.n,
  g.n > 60                                                          AS es_qr,
  'de000000-0000-4000-8000-' || lpad(g.n::text, 12, '0')            AS uuid,
  c.*,
  CURRENT_DATE - (g.n * 7) % 30
    + interval '8 hours' + ((g.n * 37) % 600) * interval '1 minute' AS fecha,
  lpad((50 - ((g.n * 7) % 30) / 7)::text, 6, '0')                   AS lote,
  lpad(g.n::text, 6, '0')                                           AS referencia,
  lpad(((g.n * 48271) % 1000000)::text, 6, '0')                     AS autorizacion,
  round(15 + (g.n * 37) % 500 + (g.n % 100) / 100.0, 2)             AS monto,
  CASE WHEN g.n > 60 THEN 10
       WHEN g.n % 10 = 0 THEN 2
       WHEN g.n % 13 = 0 THEN 3
       ELSE 1 END                                                   AS tipo_trx,
  (ARRAY['VISA', 'MASTERCARD', 'VISA', 'AMEX'])[g.n % 4 + 1]        AS marca,
  (ARRAY['A0000000031010', 'A0000000041010', 'A0000000031010', 'A00000002501'])[g.n % 4 + 1] AS aid,
  (ARRAY['JUAN PEREZ', 'MARIA LOPEZ', 'CARLOS QUISPE', 'ANA MAMANI', 'LUIS ROJAS'])[g.n % 5 + 1] AS titular,
  '************' || lpad(((g.n * 7919) % 10000)::text, 4, '0')      AS tarjeta,
  (4000000 + g.n * 1371)::text                                      AS cedula
FROM generate_series(1, 70) AS g(n)
JOIN demo_comercio c ON c.idx = g.n % 3;

INSERT INTO "Merchants"
  ("merchant_Title", "merchant_Name", "merchant_Address", "merchant_Phone", "merchant_City",
   "merchant_MID", "merchant_TID", "merchant_TrxID", "merchant_VersionPos", "merchant_UUID",
   "merchant_modeloPos", "Email")
SELECT nombre, nombre, direccion, telefono, ciudad, mid, tid, referencia, '2.4.1', uuid, modelo, email
FROM demo_venta;

INSERT INTO "Client" ("Client_CC", "Client_Email", "Client_Phone", "Client_Auth", "Client_UUID", "Tipo_Envio")
SELECT
  cedula, 'cliente' || n || '@demo.test', '7' || lpad(((n * 7331) % 10000000)::text, 7, '0'),
  autorizacion, uuid, (ARRAY[1, 2, 3, 6])[n % 4 + 1]
FROM demo_venta;

INSERT INTO "Transactions"
  ("Transac_Lot", "Transac_Ref", "Transac_TypeTrx", "Transac_TypeRead", "Transac_Label", "Transac_NameCard",
   "Transac_AID", "Transac_NumCard", "Transac_Date", "Transac_RRN", "Transac_Aut", "Transac_SMOD", "Transac_IVA",
   "Transac_Total", "Transac_Amount", "Transac_ClientID", "Transac_UUID", "Transac_RESERVADO3", "Transac_modo_caja")
SELECT
  lote, referencia, tipo_trx, n % 3 + 1, marca, titular,
  aid, tarjeta, fecha, to_char(fecha, 'YYMMDD') || referencia, autorizacion, '00', '0.00',
  monto::text, monto::text, cedula, uuid,
  CASE WHEN n % 6 = 0 THEN 'PENDIENTE' ELSE 'ENVIADO' END,
  n % 5 = 0
FROM demo_venta
WHERE NOT es_qr;

INSERT INTO "TransactionQr"
  ("Uuid", "TipoTransaccionTitle", "TipoTransaccion", "TipoLectura", "NumeroAprobacion", "Referencia",
   "DateTime", "Tipo", "MonedaUsdBs", "MontoPago", "tipo_estado_transaction", "flag_modo_caja", "Res1")
SELECT uuid, 'VENTA QR', tipo_trx::text, 'QR', autorizacion, referencia, fecha, 'QR', 'BS', monto, 'A', '0', lote
FROM demo_venta
WHERE es_qr;

INSERT INTO "htmls_merchants" ("UUID", "html_voucher", "insertion_date", "type_trx", "id_type_trx")
SELECT
  v.uuid,
  format($html$
<div style="width:280px;font-family:monospace;font-size:13px;color:#111">
  <div style="text-align:center;font-weight:bold">%s</div>
  <div style="text-align:center">%s - %s</div>
  <hr>
  <div style="font-weight:bold">%s</div>
  <div>TID: %s &nbsp; MID: %s</div>
  <div>LOTE: %s &nbsp; REF: %s</div>
  <div>FECHA: %s</div>
  <div>%s</div>
  <div>AUT: %s</div>
  <hr>
  <div style="font-size:16px;font-weight:bold">TOTAL: BS. %s</div>
  <hr>
  <div style="text-align:center">*** COPIA COMERCIO ***</div>
  <div style="text-align:center;font-size:11px">Datos de demostración</div>
</div>$html$,
    v.nombre, v.direccion, v.ciudad,
    COALESCE(tt."Transact_descripcion", 'VENTA QR'),
    v.tid, v.mid, v.lote, v.referencia,
    to_char(v.fecha, 'DD/MM/YYYY HH24:MI'),
    CASE WHEN v.es_qr THEN 'PAGO CON QR' ELSE v.marca || ' ' || v.tarjeta END,
    v.autorizacion, v.monto),
  v.fecha,
  COALESCE(tt."Transact_descripcion", 'VENTA QR'),
  v.tipo_trx::text
FROM demo_venta v
LEFT JOIN "TypeTransaction" tt ON tt."Transact_id" = v.tipo_trx AND NOT v.es_qr;

-- Un cierre por comercio para cada lote ya cerrado (las 4 semanas anteriores),
-- con los totales de las ventas de ese lote.
CREATE TEMP TABLE demo_cierre ON COMMIT DROP AS
SELECT
  'de000000-0000-4000-8001-' || lpad((c.idx * 10 + s.semana)::text, 12, '0') AS uuid,
  c.*,
  lpad((50 - s.semana)::text, 6, '0')                          AS lote,
  CURRENT_DATE - s.semana * 7 + interval '23 hours 30 minutes' AS fecha,
  CASE WHEN (c.idx + s.semana) % 4 = 0 THEN 2 ELSE 1 END       AS tipo,
  t.cantidad,
  t.total
FROM demo_comercio c
CROSS JOIN generate_series(1, 4) AS s(semana)
CROSS JOIN LATERAL (
  SELECT count(*) AS cantidad, COALESCE(sum(v.monto), 0) AS total
  FROM demo_venta v
  WHERE v.tid = c.tid AND v.lote = lpad((50 - s.semana)::text, 6, '0') AND v.tipo_trx IN (1, 10)
) t;

INSERT INTO "CierreTransaccion"
  ("Cierre_TerminalID", "Cierre_Lot", "Cierre_Date", "Cierre_TypeTrx", "Cierre_TypeCierre", "Cierre_Totales",
   "Cierre_Batch", "Merchant_Email", "Merchant_Name", "Merchant_Address", "Merchant_Phone", "Merchant_City",
   "Merchant_MID", "Merchant_TID", "Cierre_UUID", "MODELOPOS")
SELECT
  tid, lote, fecha, tipo, tipo, format('VENTAS: %s | TOTAL: BS. %s', cantidad, total),
  lote, email, nombre, direccion, telefono, ciudad, mid, tid, uuid, modelo
FROM demo_cierre;

INSERT INTO "htmls_merchants" ("UUID", "html_voucher", "insertion_date", "type_trx", "id_type_trx")
SELECT
  uuid,
  format($html$
<div style="width:280px;font-family:monospace;font-size:13px;color:#111">
  <div style="text-align:center;font-weight:bold">%s</div>
  <div style="text-align:center">%s - %s</div>
  <hr>
  <div style="font-weight:bold">%s</div>
  <div>TID: %s &nbsp; MID: %s</div>
  <div>LOTE: %s</div>
  <div>FECHA: %s</div>
  <hr>
  <div>CANTIDAD VENTAS: %s</div>
  <div style="font-size:16px;font-weight:bold">TOTAL: BS. %s</div>
  <hr>
  <div style="text-align:center;font-size:11px">Datos de demostración</div>
</div>$html$,
    nombre, direccion, ciudad,
    CASE tipo WHEN 1 THEN 'CIERRE DE LOTE' ELSE 'CIERRE PARCIAL' END,
    tid, mid, lote, to_char(fecha, 'DD/MM/YYYY HH24:MI'), cantidad, total),
  fecha,
  'CIERRE',
  tipo::text
FROM demo_cierre;

COMMIT;
