-- 008: foto del comprobante de pago.
--
-- Guarda la RUTA en disco, no el archivo ni una URL pública: un comprobante
-- lleva el dinero de una persona, así que se sirve por un endpoint que
-- comprueba permisos, nunca desde una carpeta estática.
--
-- Nullable a propósito. La obligatoriedad depende del método de pago
-- (`requiresReceipt` en @apexg/core: todo lo que no sea efectivo), y eso es
-- una regla de negocio que valida la API — no algo que una columna NOT NULL
-- pueda expresar, porque los pagos en efectivo nunca tendrán archivo.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_path VARCHAR(255);
