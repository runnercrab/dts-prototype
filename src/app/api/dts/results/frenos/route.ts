// src/app/api/dts/results/frenos/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

type FrenoItem = {
  rank: number;
  criterion_code: string;
  title: string;
  plain_impact: string;
  symptom: string;
  suggested_action: string;
  impact_score: number;
  effort_score: number;
  note?: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = (searchParams.get("assessmentId") || "").trim();

    if (!assessmentId || !isUuid(assessmentId)) {
      return NextResponse.json(
        { error: "Invalid assessmentId (expected UUID)" },
        { status: 400 }
      );
    }

    // Env
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!url || !serviceKey) {
      return NextResponse.json(
        {
          error:
            "Missing env vars: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    // Verifica que existe y recupera pack (usamos tu RPC ya estable)
    const { data, error } = await supabase.rpc("dts_results_v1", {
      p_assessment_id: assessmentId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const payload = Array.isArray(data)
      ? (data[0]?.results_v1 ?? data[0] ?? null)
      : ((data as any)?.results_v1 ?? data);

    if (!payload) {
      return NextResponse.json({ error: "No data for assessmentId" }, { status: 404 });
    }

    const pack = (payload.pack || "mvp12_v1") as string;

    // ⚠️ MVP: por ahora devolvemos frenos “predefinidos por pack”.
    // Importante: NO decimos que se deduce de sus respuestas (todavía).
    const items: FrenoItem[] = getFrenosForPack(pack);

    const res = NextResponse.json(
      {
        assessment_id: assessmentId,
        pack,
        count: items.length,
        items,
        disclaimer:
          "MVP: estos frenos están predefinidos por el pack (aún no se calculan desde tu scoring). En la siguiente iteración los conectamos a AS-IS/TO-BE/Importance.",
      },
      { status: 200 }
    );

    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

function getFrenosForPack(pack: string): FrenoItem[] {
  // Si mañana cambias el pack, aquí metes otro mapping.
  if (pack !== "mvp12_v1") return baseFrenos();

  // 12 frenos (porque tú lo pediste: “pon todos, son 12”)
  // Nota: títulos/impactos en lenguaje CEO, sin afirmar que provienen del score.
  const demoNote = "Demo MVP12 (no calculado aún desde respuestas).";

  return [
    {
      rank: 1,
      criterion_code: "D1-1.1",
      title: "La experiencia del cliente no está gobernada end-to-end",
      plain_impact: "Se pierde fidelidad y se encarecen ventas/soporte por fricción.",
      symptom: "Quejas repetidas, tiempos de respuesta variables, canales desconectados.",
      suggested_action: "Mapear 1 journey crítico y fijar 3 KPIs operativos (tiempo, resolución, NPS).",
      impact_score: 5,
      effort_score: 3,
      note: demoNote,
    },
    {
      rank: 2,
      criterion_code: "D1-1.4",
      title: "El customer journey no está optimizado como sistema",
      plain_impact: "Baja conversión y más churn por puntos de abandono no detectados.",
      symptom: "No se sabe dónde se cae el cliente ni por qué.",
      suggested_action: "Instrumentar el funnel y priorizar 2 ‘drop-offs’ con dueño y fecha.",
      impact_score: 5,
      effort_score: 2,
      note: demoNote,
    },
    {
      rank: 3,
      criterion_code: "D2-2.1",
      title: "La transformación no está conectada a valor de negocio",
      plain_impact: "Se invierte en iniciativas sin retorno claro; se ralentiza la ejecución.",
      symptom: "Muchas iniciativas, poca claridad de impacto y prioridades.",
      suggested_action: "Definir 3 objetivos de valor (coste/ingreso/cobro) y alinear iniciativas a eso.",
      impact_score: 5,
      effort_score: 3,
      note: demoNote,
    },
    {
      rank: 4,
      criterion_code: "D2-2.2",
      title: "Innovación sin un sistema repetible",
      plain_impact: "Dependencia de ‘héroes’; lo nuevo no escala ni llega a operación.",
      symptom: "POCs que mueren, pilotos eternos, nadie ‘industrializa’.",
      suggested_action: "Crear un pipeline simple: idea → piloto (4 semanas) → escala (owner + criterio).",
      impact_score: 4,
      effort_score: 3,
      note: demoNote,
    },
    {
      rank: 5,
      criterion_code: "D2-2.5",
      title: "Tecnología no habilita la estrategia al ritmo que se necesita",
      plain_impact: "Time-to-market lento; se pierde ventaja frente a competidores.",
      symptom: "Backlog infinito, entregas tardías, dependencias entre equipos.",
      suggested_action: "Definir 1–2 capacidades tecnológicas ‘core’ y eliminar cuellos de botella.",
      impact_score: 4,
      effort_score: 4,
      note: demoNote,
    },
    {
      rank: 6,
      criterion_code: "D3-3.1",
      title: "Arquitectura digital poco abierta/modular",
      plain_impact: "Integrar cosas cuesta; cada cambio rompe; crece el coste de IT.",
      symptom: "Integraciones ad-hoc, proyectos largos para cambios pequeños.",
      suggested_action: "Establecer 1 capa API y estándares mínimos de integración.",
      impact_score: 4,
      effort_score: 4,
      note: demoNote,
    },
    {
      rank: 7,
      criterion_code: "D3-3.3",
      title: "Infraestructura no integrada (datos/sistemas dispersos)",
      plain_impact: "Decisiones lentas y errores por inconsistencias.",
      symptom: "‘Cada área tiene su número’, reconciliaciones manuales.",
      suggested_action: "Elegir 1 ‘fuente de verdad’ para 3 métricas críticas y automatizar su pipeline.",
      impact_score: 4,
      effort_score: 3,
      note: demoNote,
    },
    {
      rank: 8,
      criterion_code: "D3-3.4",
      title: "Aseguramiento y control con poca inteligencia",
      plain_impact: "Incidencias repetidas y coste operacional alto.",
      symptom: "Alertas que no priorizan, problemas que se detectan tarde.",
      suggested_action: "Definir severidades y automatizar 2 acciones de contención.",
      impact_score: 4,
      effort_score: 3,
      note: demoNote,
    },
    {
      rank: 9,
      criterion_code: "D4-4.3",
      title: "Resiliencia operativa insuficiente",
      plain_impact: "Riesgo de paradas y pérdidas por incidentes.",
      symptom: "Dependencias críticas sin plan; ‘apagamos fuegos’.",
      suggested_action: "Identificar 3 riesgos críticos y preparar playbooks (quién/qué/cuándo).",
      impact_score: 5,
      effort_score: 4,
      note: demoNote,
    },
    {
      rank: 10,
      criterion_code: "D4-4.4",
      title: "Operaciones no guiadas por estrategia",
      plain_impact: "Se optimiza localmente y se pierde eficiencia global.",
      symptom: "KPIs por silos; decisiones que chocan entre áreas.",
      suggested_action: "Alinear 5 KPIs operativos con 3 objetivos estratégicos (y revisarlos semanalmente).",
      impact_score: 4,
      effort_score: 2,
      note: demoNote,
    },
    {
      rank: 11,
      criterion_code: "D5-5.2",
      title: "Talento digital sin mentalidad y rutinas",
      plain_impact: "La adopción se frena; la inversión en herramientas no se aprovecha.",
      symptom: "Uso irregular, resistencia, falta de ownership.",
      suggested_action: "Crear 2 rutinas: formación mínima + ‘champions’ por área con objetivos.",
      impact_score: 4,
      effort_score: 3,
      note: demoNote,
    },
    {
      rank: 12,
      criterion_code: "D6-6.1/6.2",
      title: "Datos no se usan como motor diario de decisiones",
      plain_impact: "Menos control del cash flow y menor capacidad de anticipación.",
      symptom: "Decisiones por intuición; reporting lento.",
      suggested_action: "Definir 1 ‘tablero CEO’ con 8 métricas y refresco automático.",
      impact_score: 5,
      effort_score: 3,
      note: demoNote,
    },
  ];
}

function baseFrenos(): FrenoItem[] {
  return [
    {
      rank: 1,
      criterion_code: "MVP",
      title: "Freno genérico (pack no reconocido)",
      plain_impact: "Impacto no definido.",
      symptom: "N/A",
      suggested_action: "Configura mapping del pack a frenos.",
      impact_score: 3,
      effort_score: 3,
      note: "Configurar getFrenosForPack(pack).",
    },
  ];
}
