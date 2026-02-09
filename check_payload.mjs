import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const sb = createClient(url, key)
const { data, error } = await sb.rpc('dts_v1_results', {
  p_assessment_id: '6cfe6e92-f8dc-4383-b5ee-b1184626be23'
})

if (error) { console.error(error); process.exit(1) }
console.log(JSON.stringify(data, null, 2))
