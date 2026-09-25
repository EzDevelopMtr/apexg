import { describe, expect, it } from "vitest";

import type { IsoDate } from "./calendar";
import { isIsoDate } from "./calendar";

import { fromPesos } from "./money";
import type { SavingsContribution, SavingsPocket } from "./savings";
import {
  contributionRefusal,
  openPockets,
  pocketProgress,
  savedInPocket,
  toSavingsContributionId,
  toSavingsPocketId,
  totalSaved,
} from "./savings";

const date = (value: string): IsoDate => {
  if (!isIsoDate(value)) throw new Error(`fecha de prueba inválida: ${value}`);
  return value;
};

const MAQUINA = toSavingsPocketId("maquina");
const ARRIENDO = toSavingsPocketId("arriendo");

function pocket(overrides: Partial<SavingsPocket> = {}): SavingsPocket {
  return {
    id: MAQUINA,
    name: "Máquina nueva",
    goal: fromPesos(3_000_000),
    closed: false,
    createdOn: date("2026-09-01"),
    ...overrides,
  };
}

function contribution(
  amountPesos: number,
  overrides: Partial<SavingsContribution> = {},
): SavingsContribution {
  return {
    id: toSavingsContributionId(`c-${amountPesos}-${overrides.pocketId ?? MAQUINA}`),
    pocketId: MAQUINA,
    amount: fromPesos(amountPesos),
    contributedOn: date("2026-09-10"),
    notes: "",
    recordedBy: "recepcion",
    ...overrides,
  };
}

describe("savedInPocket", () => {
  it("suma solo los aportes de ese bolsillo", () => {
    const aportes = [
      contribution(500_000),
      contribution(700_000),
      contribution(900_000, { pocketId: ARRIENDO }),
    ];

    expect(savedInPocket(aportes, MAQUINA)).toBe(fromPesos(1_200_000));
    expect(savedInPocket(aportes, ARRIENDO)).toBe(fromPesos(900_000));
  });

  it("sin aportes devuelve cero", () => {
    expect(savedInPocket([], MAQUINA)).toBe(fromPesos(0));
  });
});

describe("totalSaved", () => {
  it("suma todos los bolsillos", () => {
    expect(
      totalSaved([contribution(500_000), contribution(900_000, { pocketId: ARRIENDO })]),
    ).toBe(fromPesos(1_400_000));
  });
});

describe("pocketProgress", () => {
  it("calcula lo ahorrado, lo que falta y el porcentaje", () => {
    const avance = pocketProgress(pocket(), [contribution(1_200_000)]);

    expect(avance.saved).toBe(fromPesos(1_200_000));
    expect(avance.remaining).toBe(fromPesos(1_800_000));
    expect(avance.percent).toBe(40);
    expect(avance.reached).toBe(false);
  });

  it("pasada la meta, lo que falta es cero y el porcentaje no supera 100", () => {
    const avance = pocketProgress(pocket(), [contribution(3_500_000)]);

    expect(avance.remaining).toBe(fromPesos(0));
    expect(avance.percent).toBe(100);
    expect(avance.reached).toBe(true);
  });

  it("una meta en cero se informa alcanzada, sin dividir por cero", () => {
    const avance = pocketProgress(pocket({ goal: fromPesos(0) }), []);

    expect(avance.percent).toBe(100);
    expect(avance.reached).toBe(true);
  });

  it("ignora los aportes de otro bolsillo", () => {
    const avance = pocketProgress(pocket(), [
      contribution(3_000_000, { pocketId: ARRIENDO }),
    ]);

    expect(avance.saved).toBe(fromPesos(0));
    expect(avance.percent).toBe(0);
  });
});

describe("contributionRefusal", () => {
  it("acepta un monto positivo en un bolsillo abierto", () => {
    expect(contributionRefusal(pocket(), fromPesos(50_000))).toBeNull();
  });

  it("acepta superar la meta: la meta orienta, no limita", () => {
    expect(contributionRefusal(pocket(), fromPesos(9_000_000))).toBeNull();
  });

  it("rechaza cero y negativos", () => {
    expect(contributionRefusal(pocket(), fromPesos(0))).toBe("notPositive");
    expect(contributionRefusal(pocket(), fromPesos(-1000))).toBe("notPositive");
  });

  it("rechaza un bolsillo cerrado", () => {
    expect(contributionRefusal(pocket({ closed: true }), fromPesos(50_000))).toBe(
      "pocketClosed",
    );
  });

  it("rechaza un bolsillo que no existe", () => {
    expect(contributionRefusal(undefined, fromPesos(50_000))).toBe("unknownPocket");
  });
});

describe("openPockets", () => {
  it("deja fuera los cerrados", () => {
    const abiertos = openPockets([
      pocket(),
      pocket({ id: ARRIENDO, name: "Arriendo", closed: true }),
    ]);

    expect(abiertos).toHaveLength(1);
    expect(abiertos[0]?.name).toBe("Máquina nueva");
  });
});
