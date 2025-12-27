import React from 'react';
import Image from 'next/image';

const ProblemaSection: React.FC = () => {
  const dimensiones = [
    {
      iconPath: "/icons/target.png",
      iconAlt: "Estrategia",
      emoji: "🎯",
      title: "ESTRATEGIA",
      subtitle: "¿A dónde va mi negocio?",
      problemas: [
        "Inviertes en proyectos que no dan resultado",
        "Cada semana hay urgencias y cambias de plan",
        "No sabes qué priorizar con tu presupuesto"
      ],
      beneficios: [
        "Claridad total: Sabes qué hacer primero y por qué",
        "Ahorras dinero: Dejas de invertir en lo que no vale",
        "Tu equipo avanza en una dirección sin perder tiempo"
      ],
      herramientas: "Dashboards ejecutivos (Power BI, Tableau), OKRs, Análisis de ROI",
      impacto: "Por fin sé qué hacer primero, cuánto cuesta y qué retorno tiene.",
      palancas: ["Control", "Costes"]
    },
    {
      iconPath: "/icons/handshake.png",
      iconAlt: "Cliente",
      emoji: "🤝",
      title: "CLIENTE",
      subtitle: "¿Cómo vendo más sin trabajar más?",
      problemas: [
        "Pierdes clientes porque tardas en responder",
        "No sabes cuántas oportunidades de venta tienes abiertas",
        "Cada cliente viene por un canal diferente"
      ],
      beneficios: [
        "Atención 24/7 automática con chatbots",
        "Más conversión de ventas porque no pierdes oportunidades",
        "Clientes más satisfechos que recomiendan"
      ],
      herramientas: "CRM (HubSpot, Salesforce), Chatbots IA, Marketing Automation, Omnicanal",
      impacto: "Vendo más, atiendo mejor y no pierdo clientes por fallos tontos.",
      palancas: ["Ventas", "Experiencia del Cliente"]
    },
    {
      iconPath: "/icons/chip.png",
      iconAlt: "Tecnología",
      emoji: "🔧",
      title: "TECNOLOGÍA",
      subtitle: "¿Por qué se cae todo?",
      problemas: [
        "Los sistemas van lentos o se caen",
        "Tu equipo pierde tiempo esperando que cargue",
        "Tienes miedo de que algo falle y pierdan datos"
      ],
      beneficios: [
        "Todo funciona rápido y estable",
        "Menos interrupciones y pérdida de tiempo",
        "Tu empresa está protegida (ciberseguridad)"
      ],
      herramientas: "Cloud (AWS, Azure), APIs, Low-code (Power Apps), Ciberseguridad",
      impacto: "Todo funciona mejor, más rápido y sin interrupciones.",
      palancas: ["Eficiencia", "Riesgo", "Control"]
    },
    {
      iconPath: "/icons/users.png",
      iconAlt: "Personas",
      emoji: "👥",
      title: "PERSONAS",
      subtitle: "¿Por qué mi equipo no usa las herramientas?",
      problemas: [
        "Compras software pero nadie lo usa",
        "Tu equipo se resiste al cambio",
        "Dependes de 2-3 \"héroes\" que saben todo"
      ],
      beneficios: [
        "Equipos productivos que adoptan la tecnología",
        "Menos dependencia de personas clave",
        "Colaboración fluida sin perder información"
      ],
      herramientas: "Teams/Slack, Formación digital (LMS), Metodologías ágiles, Google Workspace",
      impacto: "La gente trabaja mejor, más rápido y sin depender de héroes.",
      palancas: ["Eficiencia", "Control"]
    },
    {
      iconPath: "/icons/gears.png",
      iconAlt: "Procesos",
      emoji: "⚙️",
      title: "PROCESOS",
      subtitle: "¿Por qué todo tarda tanto?",
      problemas: [
        "Tareas repetitivas que consumen tiempo",
        "Errores al copiar datos entre sistemas",
        "Cuellos de botella que retrasan todo"
      ],
      beneficios: [
        "Automatización de tareas manuales",
        "Menos errores (hasta 90% de reducción)",
        "Procesos 10x más rápidos"
      ],
      herramientas: "RPA (robots), Power Automate/Zapier, BPM, ERP (Odoo, SAP)",
      impacto: "Mi empresa va sola: menos esfuerzo, más control y menos errores.",
      palancas: ["Costes", "Eficiencia"]
    },
    {
      iconPath: "/icons/database.png",
      iconAlt: "Datos",
      emoji: "📊",
      title: "DATOS",
      subtitle: "¿Por qué no sé qué está pasando?",
      problemas: [
        "Datos dispersos en Excel, emails, papeles",
        "No sabes qué cifra es la correcta",
        "Tardas días en hacer un informe"
      ],
      beneficios: [
        "Informes fiables en tiempo real",
        "Detectas problemas antes de que exploten",
        "Decisiones basadas en hechos, no intuiciones"
      ],
      herramientas: "Power BI/Tableau, Data Warehouse, IA + Predicción, Calidad del dato",
      impacto: "Decido rápido y con datos fiables, no con intuiciones.",
      palancas: ["Control", "Ventas", "Riesgo"]
    }
  ];

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Las 6 Áreas que Transforman tu Empresa
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Sin jerga técnica. Solo problemas reales y soluciones que funcionan.
          </p>
        </div>

        {/* Grid de dimensiones */}
        <div className="space-y-8 mb-12">
          {dimensiones.map((dim, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="grid md:grid-cols-[300px_1fr] gap-0">
                {/* Columna izquierda */}
                <div
                  className="p-6 flex flex-col items-center justify-center text-center"
                  style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' }}
                >
                  <div className="flex items-center justify-center rounded-lg mb-4 bg-white" style={{ width: '100px', height: '100px' }}>
                    <Image src={dim.iconPath} alt={dim.iconAlt} width={70} height={70} className="w-auto h-auto" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{dim.title}</h3>
                  <p className="text-xl font-semibold text-gray-700 mb-4">{dim.subtitle}</p>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {dim.palancas.map((palanca, i) => (
                      <span
                        key={i}
                        className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                        style={{ background: '#1e40af', color: 'white' }}
                      >
                        {palanca}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-base font-bold text-red-600 mb-2">Tu problema real:</p>
                    <ul className="space-y-1">
                      {dim.problemas.map((problema, i) => (
                        <li key={i} className="flex items-start gap-2 text-base text-gray-700">
                          <span className="text-red-500 flex-shrink-0 mt-0.5">✗</span>
                          <span>{problema}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-base font-bold text-green-600 mb-2">Qué consigues:</p>
                    <ul className="space-y-1">
                      {dim.beneficios.map((beneficio, i) => (
                        <li key={i} className="flex items-start gap-2 text-base text-gray-700">
                          <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                          <span>{beneficio}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-base font-bold text-blue-600 mb-1">Herramientas que te ayudan:</p>
                    <p className="text-base text-gray-600">{dim.herramientas}</p>
                  </div>

                  <div className="p-4 rounded-lg border-l-4" style={{ background: '#f0f9ff', borderColor: '#2563eb' }}>
                    <p className="text-base font-semibold italic text-gray-800">
                      💡 "{dim.impacto}"
                    </p>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Resumen rápido */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            📊 Resumen: ¿Qué ganas mejorando estas 6 áreas?
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl text-blue-600">①</span>
                <div>
                  <p className="font-bold text-gray-900">Estrategia</p>
                  <p className="text-sm text-gray-600">Sabes QUÉ hacer y CUÁNDO</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl text-blue-600">②</span>
                <div>
                  <p className="font-bold text-gray-900">Cliente</p>
                  <p className="text-sm text-gray-600">Vendes MÁS con MENOS esfuerzo</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl text-blue-600">③</span>
                <div>
                  <p className="font-bold text-gray-900">Tecnología</p>
                  <p className="text-sm text-gray-600">Todo FUNCIONA sin caídas</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl text-blue-600">④</span>
                <div>
                  <p className="font-bold text-gray-900">Personas</p>
                  <p className="text-sm text-gray-600">Tu equipo ADOPTA las herramientas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl text-blue-600">⑤</span>
                <div>
                  <p className="font-bold text-gray-900">Procesos</p>
                  <p className="text-sm text-gray-600">Reduces TIEMPO y ERRORES</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl text-blue-600">⑥</span>
                <div>
                  <p className="font-bold text-gray-900">Datos</p>
                  <p className="text-sm text-gray-600">Tomas DECISIONES con información REAL</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ProblemaSection;
