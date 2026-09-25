/**
 * Los campos de un registro más su archivo, en un solo cuerpo multipart.
 *
 * Todo entra como texto: multipart no tiene tipos, y los DTO del backend ya
 * tratan estos campos como cadenas que validan por patrón. Los `undefined` se
 * quedan fuera — mandarlos como la cadena "undefined" es exactamente lo que
 * los campos opcionales existen para evitar.
 *
 * @param fieldName El nombre que escucha el `FileInterceptor` del endpoint.
 */
export function toFormData(
  fields: Record<string, unknown>,
  file: Blob,
  fieldName = "photo",
): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) form.append(key, String(value));
  }
  form.append(fieldName, file);
  return form;
}
