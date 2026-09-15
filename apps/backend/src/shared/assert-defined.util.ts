/**
 * `noUncheckedIndexedAccess` (heredado ahora de `@apexg/typescript-config`,
 * al vivir este backend en el mismo monorepo que el frontend) marca
 * `const [row] = await db.insert(...).returning()` como `T | undefined` —
 * correctamente: nada garantiza en el TIPO que un INSERT/UPDATE devuelva
 * fila. En la práctica, un insert por PK recién generada o un update por
 * id ya validado siempre trae exactamente una — si alguna vez no la trae,
 * es un bug real que vale la pena que explote con un mensaje claro, no un
 * `TypeError: Cannot read properties of undefined` críptico más abajo.
 */
export function assertDefined<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}
