"use client";

import { useState } from "react";
import { today } from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { useFinanceOverview } from "../hooks/use-finance-overview";
import { useFinancePeriod } from "../hooks/use-finance-period";
import BreakdownCards from "./breakdown-cards";
import CommissionsPanel from "./commissions-panel";
import ContactCard from "./contact-card";
import FinanceKpis from "./finance-kpis";
import PeriodFilter from "./period-filter";
import SavingsPanel from "./savings-panel";
import TrendCard from "./trend-card";

/** Título de cada bloque, del mismo peso que los de las tarjetas. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-body">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Finanzas en una sola vista (RF-31 a RF-35).
 *
 * Antes eran cuatro pestañas —panel, balance, bolsillos, comisiones— y para
 * ver el mes completo había que recorrerlas todas. Ahora se lee de arriba a
 * abajo en el orden en que se decide: qué periodo se mira, cómo le fue,
 * hacia dónde va la tendencia, de dónde sale y en qué se va la plata, a quién cobrarle, y qué
 * está comprometido (ahorro y comisiones).
 *
 * Solo para el administrador: §2.2 niega los reportes consolidados a la
 * recepcionista, y el guard de la ruta lo hace cumplir.
 */
export default function FinancesPage() {
  const [referenceDate] = useState(today);
  const period = useFinancePeriod(referenceDate);
  const overview = useFinanceOverview(referenceDate, period.range);

  return (
    <CollectionGate
      collection={overview.gate}
      loadingMessage="Cargando información financiera..."
      errorMessage="No pudimos cargar la información financiera."
    >
      <div className="space-y-8">
        <PeriodFilter period={period} />
        <FinanceKpis overview={overview} versus={period.period.versus} />
        <TrendCard overview={overview} />
        <BreakdownCards overview={overview} rangeLabel={period.rangeLabel} />
        <ContactCard overview={overview} />
        <Section title="Bolsillos de ahorro">
          <SavingsPanel />
        </Section>
        <Section title="Comisiones de entrenadores">
          <CommissionsPanel />
        </Section>
      </div>
    </CollectionGate>
  );
}
