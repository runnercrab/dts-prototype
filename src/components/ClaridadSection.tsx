import React from 'react';

const ClaridadSection: React.FC = () => {
  const steps = [
    {
      number: "①",
      titulo: "Lo que realmente te frena",
      contenido:
        "Diriges el negocio, tomas decisiones cada día y apagas fuegos. Sabes que deberías mejorar procesos, tecnología y datos… pero nadie te dice por dónde empezar ni qué ganarás."
    },
    {
      number: "②",
      titulo: "La confusión del mundo digital",
      contenido: "Transformación digital, IA, madurez del dato… Demasiadas palabras bonitas, poca claridad práctica."
    },
    {
      number: "③",
      titulo: "Tu problema no es la tecnología. Es la falta de dirección.",
      contenido:
        "Nadie te dice qué pasos dar, en qué orden, cuánto costará ni qué impacto tendrá en ventas, costes o eficiencia. Analizamos tu empresa con una metodología internacional y la traducimos a decisiones simples: qué mejorar, en qué orden y qué impacto económico tiene."
    },
    {
      number: "④",
      titulo: "Un plan claro, realista",
      lista: [
        "Te hacemos unas pocas preguntas clave para entender tu negocio y calcular impacto real.",
        "Diagnosticamos tu empresa en 6 áreas clave, con 129 criterios objetivos.",
        "Detectamos tus brechas reales, no las teóricas.",
        "Calculamos impacto en horas y en ingresos.",
        "Ordenamos las iniciativas según impacto y esfuerzo, empezando por las que más valor dan con menos complejidad, y construimos un roadmap realista.",
        "Te acompañamos en todo momento, ajustando el plan según lo que ocurre de verdad."
      ]
    },
    {
      number: "⑤",
      titulo: "No avanzas solo",
      contenido:
        "Tu Avatar Digital te guía 24/7, explicando cada paso con tu lenguaje, es como un copiloto, Tu avatar no espera a que preguntes, te avisa:",
      lista: ["qué significa cada brecha", "qué decisiones debes tomar", "cuándo te estás desviando del plan"]
    },
    {
      number: "⑥",
      titulo: "Esto no es un informe. Es un sistema vivo.",
      subtitle: "Cada mes, Gapply:",
      lista: ["recalcula el impacto que ya has conseguido", "detecta lo que se está bloqueando", "ajusta prioridades", "te avisa cuando hay que decidir"]
    }
  ];

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Claridad para dirigir tu empresa en un mundo digital
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Te mostramos qué mejorar, en qué orden y con qué impacto. Sin tecnicismos. Sin humo. Con{' '}
            <strong className="text-gray-900">avatar digital que habla tu idioma</strong>.
          </p>
        </div>

        {/* Grid de pasos - UNA COLUMNA */}
        <div className="max-w-4xl mx-auto space-y-6 mb-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative p-6 rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-all duration-300"
            >
              {/* Número en círculo */}
              <div className="absolute -top-6 -left-6 flex items-center justify-center w-20 h-20 rounded-full bg-blue-600 text-white text-4xl font-bold shadow-lg">
                {step.number}
              </div>

              {/* Contenido */}
              <div className="pt-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.titulo}</h3>

                {step.contenido && (
                  <p className="text-lg text-gray-700 leading-relaxed mb-4">{step.contenido}</p>
                )}

                {step.subtitle && (
                  <p className="text-lg font-semibold text-gray-800 mb-3">{step.subtitle}</p>
                )}

                {step.lista && (
                  <ul className="space-y-2 mb-4">
                    {step.lista.map((item, i) => (
                      <li key={i} className="flex items-start text-base text-gray-700">
                        <span className="text-blue-600 mr-3 mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Promesa final - SIN CTA */}
        <div
          className="relative p-8 rounded-2xl text-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)' }}
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full translate-x-1/2 translate-y-1/2"></div>

          <div className="relative z-10">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Te decimos qué mejorar, en qué orden y con qué impacto
            </h3>

            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Y con claridad, una pyme avanza.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ClaridadSection;
