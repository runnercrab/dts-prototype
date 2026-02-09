const fs = require('fs');
const lines = fs.readFileSync('.env.local','utf8').split('\n');
const env = {};
lines.forEach(l => { if(l && l[0] !== '#') { const [k,...v] = l.split('='); env[k.trim()] = v.join('=').trim(); }});
process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
import('@supabase/supabase-js').then(({createClient}) => {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  sb.rpc('dts_v1_results', {p_assessment_id:'6cfe6e92-f8dc-4383-b5ee-b1184626be23'}).then(({data,error}) => {
    if(error) console.error(error);
    else console.log(JSON.stringify(data.frenos, null, 2));
  });
});
