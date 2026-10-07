import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const result = spawnSync('npx',['wrangler','deploy','--dry-run','--outdir','.local/worker'],{stdio:'inherit',env:{...process.env,CI:'true',WRANGLER_SEND_METRICS:'false',XDG_CONFIG_HOME:resolve('.local/config')}});
process.exit(result.status ?? 1);
