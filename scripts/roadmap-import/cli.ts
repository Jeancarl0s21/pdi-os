#!/usr/bin/env node
import { loadSeed } from './src/load';
import { buildManifest, canonicalJson, manifestCounts, sha256 } from './src/manifest';
import { applyImport, planImport } from './src/db';

const command=process.argv[2] ?? 'validate';
const seed=await loadSeed(); const manifest=buildManifest(seed); const checksum=sha256(canonicalJson(seed));
const counts=manifestCounts(manifest);
const expected={tracks:1,modules:14,topics:74,contents:336,activities:74,materials:144,projects:5};
for(const [key,value] of Object.entries(expected)) if(counts[key]!==value) throw new Error(`Count gate failed for ${key}: ${counts[key]} != ${value}`);
if(new Set(manifest.map(x=>`${x.entityType}:${x.sourceKey}`)).size!==manifest.length) throw new Error('Duplicate manifest source identity');
if(command==='validate'){console.log(JSON.stringify({ok:true,seedVersion:seed.metadata.version,checksum,counts,mappings:counts.project_topics??0},null,2));process.exit(0);}
const dbUrl=process.env.SUPABASE_DB_URL; const userId=process.env.PDI_OWNER_USER_ID;
if(!dbUrl||!userId) throw new Error('SUPABASE_DB_URL and PDI_OWNER_USER_ID are required for database commands');
const plan=await planImport(dbUrl,userId,manifest);
const summary=plan.reduce<Record<string,number>>((a,c)=>{a[c.action]=(a[c.action]??0)+1;return a;},{});
if(command==='dry-run'){console.log(JSON.stringify({seedVersion:seed.metadata.version,checksum,summary,changes:plan.filter(x=>x.action!=='NOOP')},null,2));process.exit(summary.CONFLICT?2:0);}
if(command==='apply'){if(process.env.CONFIRM_SEED_APPLY!=='YES') throw new Error('Set CONFIRM_SEED_APPLY=YES for explicit apply'); const result=await applyImport(dbUrl,userId,seed.metadata.version,checksum,manifest,plan); console.log(JSON.stringify(result,null,2));process.exit(0);}
throw new Error(`Unknown command: ${command}`);
