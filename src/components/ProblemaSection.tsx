import React from 'react';

const ProblemaSection: React.FC = () => {
  const problemas = [
    "Inviertes en marketing digital pero no ves ROI claro",
    "Quieres implementar IA pero no sabes por dónde empezar",
    "Tu competencia avanza y sientes que te quedas atrás",
    "No sabes qué tecnología priorizar con tu presupuesto limitado"
  ];

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10">
            ¿Te suena familiar?
          </h2>
        </div>

        {/* Lista de problemas */}
        <div className="space-y-5 mb-12">
          {problemas.map((problema, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-5 md:p-6 bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:translate-x-2 hover:shadow-md"
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">❌</span>
              <p className="text-lg text-gray-700 leading-relaxed">
                {problema}
              </p>
            </div>
          ))}
        </div>

        {/* Transición */}
        <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-500">
          <p className="text-lg md:text-xl text-gray-800 font-medium">
            Miles de empresas enfrentan esto cada día. Por eso creamos DTS.
          </p>
        </div>

      </div>
    </section>
  );
};

export default ProblemaSection;