#!/bin/bash

# Script Automatizado: Actualizar Configuración de Supabase
# 
# Este script automatiza los pasos 2 y 3 del tutorial:
# - Reemplaza src/lib/supabase.ts con la nueva configuración
# - Hace commit y push automáticamente
#
# Uso:
#   chmod +x fix-supabase.sh
#   ./fix-supabase.sh

echo "🔧 Script de Actualización de Supabase"
echo "======================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No estás en la raíz del proyecto dts-prototype"
    echo "   Navega al directorio del proyecto primero:"
    echo "   cd ~/dts-prototype"
    exit 1
fi

echo "✅ Directorio correcto detectado"
echo ""

# Verificar que src/lib existe
if [ ! -d "src/lib" ]; then
    echo "⚠️  Creando directorio src/lib..."
    mkdir -p src/lib
fi

# Crear el archivo supabase.ts con la configuración correcta
echo "📝 Creando nuevo archivo src/lib/supabase.ts..."

cat > src/lib/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

// ⚠️ CONFIGURACIÓN DEFINITIVA PARA VERCEL
// Las variables de entorno de Vercel no funcionan correctamente con NEXT_PUBLIC_*
// Por eso usamos valores hardcoded directamente

// URL y ANON KEY de Supabase (estos valores SON SEGUROS de exponer en el cliente)
// La seguridad real está en Row Level Security (RLS) de Supabase
const SUPABASE_URL = 'https://fgczfshqldxkyowbyuzq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY3pmc2hxbGR4a3lvd2J5dXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5MTk3MTUsImV4cCI6MjA0NjQ5NTcxNX0.VvMhZxS5k7-_jKZZNd3ZjXkJdJx5DVlGYGQSxkYY0P0'

// ❌ NO USAR process.env en producción - Vercel no lo lee bien
// Solo para desarrollo local si tienes .env.local
let supabaseUrl = SUPABASE_URL
let supabaseKey = SUPABASE_ANON_KEY

// En desarrollo local, intentar usar variables de entorno si existen
if (process.env.NODE_ENV === 'development') {
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
  supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
}

// Log para debugging (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Supabase config:', {
    url: supabaseUrl,
    keyLength: supabaseKey.length,
    usingEnvVars: supabaseUrl !== SUPABASE_URL
  })
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'dts-prototype'
    }
  }
})

// Función helper para verificar la conexión
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('dts_dmm_versions')
      .select('version_code')
      .limit(1)
    
    if (error) {
      console.error('❌ Error conectando a Supabase:', error)
      return { success: false, error }
    }
    
    console.log('✅ Conexión a Supabase exitosa')
    return { success: true, data }
  } catch (err) {
    console.error('❌ Error de red:', err)
    return { success: false, error: err }
  }
}

export default supabase
EOF

echo "✅ Archivo creado exitosamente"
echo ""

# Verificar que se creó correctamente
if [ ! -f "src/lib/supabase.ts" ]; then
    echo "❌ Error: El archivo no se creó correctamente"
    exit 1
fi

echo "📊 Verificando contenido del archivo..."
if grep -q "SUPABASE_URL = 'https://fgczfshqldxkyowbyuzq.supabase.co'" src/lib/supabase.ts; then
    echo "✅ URL hardcoded correcta"
else
    echo "⚠️  Advertencia: La URL hardcoded podría no ser correcta"
fi

if grep -q "process.env.NODE_ENV === 'development'" src/lib/supabase.ts; then
    echo "✅ Lógica de entorno correcta"
else
    echo "⚠️  Advertencia: La lógica de entorno podría no ser correcta"
fi

echo ""
echo "📤 Preparando commit..."

# Verificar estado de Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Este no es un repositorio Git"
    exit 1
fi

# Verificar que estamos en la rama main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Advertencia: No estás en la rama main (estás en: $CURRENT_BRANCH)"
    read -p "¿Quieres cambiar a main? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout main
        echo "✅ Cambiado a rama main"
    else
        echo "❌ Abortado - debes estar en la rama main"
        exit 1
    fi
fi

# Añadir archivo al staging
git add src/lib/supabase.ts

echo "✅ Archivo añadido al staging"
echo ""

# Hacer commit
echo "💾 Haciendo commit..."
git commit -m "FIX: Configuración definitiva Supabase sin variables de entorno

- Reemplazado src/lib/supabase.ts con valores hardcoded
- Eliminada dependencia de variables de entorno en producción
- Mantiene compatibilidad con desarrollo local
- Soluciona errores 404 y ERR_NAME_NOT_RESOLVED en Vercel"

if [ $? -eq 0 ]; then
    echo "✅ Commit realizado exitosamente"
else
    echo "❌ Error al hacer commit"
    exit 1
fi

echo ""

# Push a GitHub
echo "🚀 Pusheando a GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Push realizado exitosamente"
else
    echo "❌ Error al hacer push"
    echo "   Intenta manualmente: git push origin main"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ ¡COMPLETADO CON ÉXITO!"
echo "======================================"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo ""
echo "1. Ve a Vercel Deployments:"
echo "   https://vercel.com/runnercrab/dts-prototype/deployments"
echo ""
echo "2. Espera a que el deployment automático termine"
echo ""
echo "3. Redeploy SIN caché:"
echo "   - Click en el deployment"
echo "   - Click en '...' → 'Redeploy'"
echo "   - ❌ Desmarcar 'Use existing build cache'"
echo "   - Click en 'Redeploy'"
echo ""
echo "4. Verifica que funciona:"
echo "   https://dts-prototype.vercel.app/diagnostico-full"
echo ""
echo "5. Abre la consola del navegador (F12) y verifica:"
echo "   ✅ NO hay errores 404"
echo "   ✅ NO hay ERR_NAME_NOT_RESOLVED"
echo "   ✅ Aparece 'Conexión a Supabase exitosa'"
echo ""
echo "======================================"
echo ""
echo "⏱️  Tiempo total del script: ~30 segundos"
echo "⏱️  Tiempo estimado para deploy en Vercel: ~2 minutos"
echo ""
echo "📞 Si algo falla, revisa:"
echo "   - CHECKLIST_SUPABASE.md"
echo "   - TUTORIAL_PASO_A_PASO.md"
echo ""
echo "¡Buena suerte! 🍀"
