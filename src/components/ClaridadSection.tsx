import React from 'react';

const ClaridadSection: React.FC = () => {
  const steps = [
    {
      number: "①",
      titulo: "Lo que realmente te frena",
      contenido: "Estás en todo. Quieres delegar, pero no sabes en quién. Sabes que necesitas digitalizarte, pero no tienes claro por dónde empezar ni qué ganarás."
    },
    {
      number: "②",
      titulo: "La confusión del mundo digital",
      contenido: "Transformación digital, madurez del dato, IA... Demasiadas palabras bonitas, poca claridad práctica."
    },
    {
      number: "③",
      titulo: "Tu problema no es la tecnología. Es la falta de dirección.",
      contenido: "Nadie te dice qué pasos dar, en qué orden, cuánto costará ni qué impacto tendrá en ventas, costes o eficiencia."
    },
    {
      number: "④",
      titulo: "Un plan claro, realista y sin humo",
      contenido: "Gapply analiza tu empresa en 6 áreas clave y te ofrece un camino ordenado para avanzar con seguridad."
    },
    {
      number: "⑤",
      titulo: "No avanzas solo",
      contenido: "Tu Avatar Digital te guía 24/7, explicando cada paso con un lenguaje claro y humano."
    },
    {
      number: "⑥",
      titulo: "Esto es lo que te llevas con Gapply",
      contenido: "Descubrimos tus brechas. Te damos un camino para resolverlas. Te acompañamos con un avatar digital que habla tu idioma."
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
            Te mostramos qué mejorar, en qué orden y con qué impacto. Sin tecnicismos. Sin humo. Con <strong className="text-gray-900">avatar digital que habla tu idioma</strong>.
          </p>
        </div>

        {/* Grid de pasos - UNA COLUMNA */}
        <div className="max-w-4xl mx-auto space-y-6 mb-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative p-6 rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-all duration-300"
            >
              {/* Número en círculo - MÁS GRANDE */}
              <div className="absolute -top-5 -left-5 flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-3xl font-bold shadow-lg">
                {step.number}
              </div>

              {/* Contenido */}
              <div className="pt-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {step.titulo}
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {step.contenido}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Promesa final - Destacada */}
        <div 
          className="relative p-8 rounded-2xl text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)'
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10">
            <div className="inline-block px-4 py-2 bg-white bg-opacity-20 rounded-full text-white text-sm font-semibold mb-4">
              Nuestra Promesa
            </div>
            
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Hacemos claridad
            </h3>
            
            <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
              Y con claridad, una pyme avanza.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/diagnostico-full"
                className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Comenzar Diagnóstico →
              </a>
              <a
                href="#como-funciona"
                className="inline-block px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Cómo funciona
              </a>
            </div>

            <p className="text-sm text-blue-200 mt-6">
              ✓ 45-60 minutos · ✓ Sin tarjeta de crédito · ✓ Resultados inmediatos
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ClaridadSection;
