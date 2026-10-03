import type { PlatformCompany } from "@apexg/core";
import {
  Badge,
  Button,
  Table,
  TableCell,
  TableEmpty,
  TableRow,
} from "@apexg/ui";

export interface CompaniesTableProps {
  companies: readonly PlatformCompany[];
  onEdit: (id: string) => void;
}

const HEADERS = [
  "Gimnasio",
  "Entrada",
  "Estado",
  "Clientes activos",
  "Usuarios",
  "",
] as const;

export default function CompaniesTable({
  companies,
  onEdit,
}: CompaniesTableProps) {
  return (
    <Table headers={HEADERS}>
      {companies.length === 0 && (
        <TableEmpty columns={HEADERS.length} message="Aún no hay gimnasios." />
      )}
      {companies.map((company) => (
        <TableRow key={company.id}>
          <TableCell>
            <span className="flex items-center gap-3">
              <span
                aria-hidden
                className="h-3 w-3 rounded-full border border-line"
                style={
                  company.brandColor
                    ? { backgroundColor: company.brandColor }
                    : undefined
                }
              />
              <span className="font-semibold text-body">{company.name}</span>
            </span>
          </TableCell>
          <TableCell>
            <a
              href={`/${company.slug}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-brand-ink"
            >
              /{company.slug}
            </a>
          </TableCell>
          <TableCell>
            <Badge tone={company.status === "active" ? "success" : "warning"}>
              {company.status === "active" ? "Activo" : "Suspendido"}
            </Badge>
          </TableCell>
          <TableCell>{company.activeClients}</TableCell>
          <TableCell>{company.users}</TableCell>
          <TableCell className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(company.id)}
            >
              Editar
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
