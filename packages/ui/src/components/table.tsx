import type { ReactNode } from "react";

/*
  =====================================================
  TABLA
  =====================================================

  Envoltorio con scroll horizontal para que la tabla
  no rompa el diseno en pantallas pequenas.

  Uso:

    <Table encabezados={["Nombre", "Estado"]}>
      <TableRow>
        <TableCell>Juan</TableCell>
        <TableCell>Activo</TableCell>
      </TableRow>
    </Table>
*/

interface TableProps {

  // Textos de la primera fila.
  encabezados: string[];

  // Las filas de la tabla.
  children: ReactNode;
}

export default function Table({
  encabezados,
  children,
}: TableProps) {

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">

        <thead className="bg-slate-50">
          <tr>
            {encabezados.map((encabezado) => (
              <th
                key={encabezado}
                className="
                  px-6
                  py-4
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-500
                "
              >
                {encabezado}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {children}
        </tbody>

      </table>
    </div>
  );
}

/*
  -----------------------------------------------------
  FILA
  -----------------------------------------------------
*/

export function TableRow({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <tr className="transition hover:bg-slate-50">
      {children}
    </tr>
  );
}

/*
  -----------------------------------------------------
  CELDA
  -----------------------------------------------------
*/

export function TableCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-6 py-4 text-slate-700 ${className}`}>
      {children}
    </td>
  );
}

/*
  -----------------------------------------------------
  MENSAJE DE TABLA VACIA
  -----------------------------------------------------
*/

export function TableEmpty({
  columnas,
  mensaje,
}: {
  columnas: number;
  mensaje: string;
}) {
  return (
    <tr>
      <td
        colSpan={columnas}
        className="px-6 py-12 text-center text-slate-400"
      >
        {mensaje}
      </td>
    </tr>
  );
}
