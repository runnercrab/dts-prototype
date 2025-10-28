import React from 'react';

interface Fase {
  numero: string;
  titulo: string;
  descripcion: string;
  detalle: string;
  esInicio?: boolean;
}

const SolucionSection: React.FC = () => {
  const fases: Fase[] = [
    {
      numero: "📍",
      titulo: "Usted está aquí",
      descripcion: "Evaluamos tu punto de partida digital",
      detalle: "Identifica dónde estás hoy",
      esInicio: true
    },
    {
      numero: "1",
      titulo: "Fase 1 – Onboarding",
      descripcion: "Entendemos tu empresa y tus objetivos",
      detalle: "Contextualizamos tu industria y metas"
    },
    {
      numero: "2",
      titulo: "Fase 2 – Survey",
      descripcion: "El avatar te guía en una conversación interactiva",
      detalle: "Respuestas naturales, sin formularios complejos"
    },
    {
      numero: "3",
      titulo: "Fase 3 – Scoring",
      descripcion: "Analizamos tus respuestas y detectamos tus brechas",
      detalle: "Procesamiento inteligente de tu situación"
    },
    {
      numero: "4",
      titulo: "Fase 4 – Resultados",
      descripcion: "Visualizamos tus resultados: radar, brechas y oportunidades",
      detalle: "Diagnóstico visual claro y comprensible"
    },
    {
      numero: "5",
      titulo: "Fase 5 – KPIs",
      descripcion: "Conectamos resultados con indicadores reales de negocio",
      detalle: "De la teoría a métricas que impactan tu P&L"
    },
    {
      numero: "6",
      titulo: "Fase 6 – Roadmap",
      descripcion: "Tu plan de acción en 30-60-90 días",
      detalle: "Prioridades claras y pasos concretos"
    }
  ];

  return (
    <section className="py-20 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header principal */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Una evaluación diseñada para tomar decisiones claras
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            En 15 minutos obtienes un diagnóstico claro de tu situación digital y un plan de acción priorizado. 
            Sin jerga técnica, solo lo que necesitas saber para crecer.
          </p>
        </div>

        {/* Subheader con título y avatar */}
        <div className="text-center mb-16">
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6">
            De la evaluación al plan de acción en 7 pasos guiados
          </h3>
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg shadow-blue-500/30">
            <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xl">
              🤖
            </span>
            <span>El avatar DTS te guía en todo el proceso</span>
          </div>
        </div>

        {/* Timeline horizontal - Desktop */}
        <div className="hidden lg:block relative overflow-x-auto py-12">
          <div className="flex items-center justify-center gap-8 min-w-max px-8">
            
            {/* Línea conectora de fondo */}
            <div className="absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400 -z-10" />

            {fases.map((fase, index) => (
              <React.Fragment key={index}>
                {/* Fase */}
                <div className="relative z-10 text-center" style={{ minWidth: '200px', maxWidth: '240px' }}>
                  
                  {/* Círculo */}
                  <div 
                    className={`
                      ${fase.esInicio 
                        ? 'w-24 h-24 text-4xl' 
                        : 'w-20 h-20 text-2xl'
                      }
                      mx-auto mb-6 rounded-full flex items-center justify-center font-bold text-white
                      bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30
                      transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40
                    `}
                  >
                    {fase.numero}
                  </div>

                  {/* Contenido */}
                  <div 
                    className={`
                      bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm
                      transition-all duration-300 hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/20
                    `}
                  >
                    <h4 className={`
                      text-base font-semibold mb-2
                      ${fase.esInicio ? 'text-blue-600' : 'text-gray-900'}
                    `}>
                      {fase.titulo}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2 leading-snug">
                      {fase.descripcion}
                    </p>
                    <p className="text-xs text-gray-500 italic">
                      {fase.detalle}
                    </p>
                  </div>
                </div>

                {/* Flecha conectora (excepto después de la última fase) */}
                {index < fases.length - 1 && (
                  <div className="text-3xl text-blue-500 -mx-4 z-20">
                    ➡️
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Timeline vertical - Mobile/Tablet */}
        <div className="lg:hidden space-y-8">
          {fases.map((fase, index) => (
            <div key={index} className="text-center">
              
              {/* Círculo */}
              <div 
                className={`
                  ${fase.esInicio 
                    ? 'w-24 h-24 text-4xl' 
                    : 'w-20 h-20 text-2xl'
                  }
                  mx-auto mb-5 rounded-full flex items-center justify-center font-bold text-white
                  bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30
                `}
              >
                {fase.numero}
              </div>

              {/* Contenido */}
              <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm max-w-md mx-auto">
                <h4 className={`
                  text-lg font-semibold mb-2
                  ${fase.esInicio ? 'text-blue-600' : 'text-gray-900'}
                `}>
                  {fase.titulo}
                </h4>
                <p className="text-base text-gray-600 mb-2 leading-relaxed">
                  {fase.descripcion}
                </p>
                <p className="text-sm text-gray-500 italic">
                  {fase.detalle}
                </p>
              </div>

              {/* Flecha hacia abajo (excepto en la última fase) */}
              {index < fases.length - 1 && (
                <div className="text-3xl text-blue-500 my-4">
                  ⬇️
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default SolucionSection;