import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const root=process.cwd(), fail=[], pass=[];
const seedPath=path.join(root,'scripts/roadmap-import/data/PDI_OS_Data_Engineering_Seed_V1.2.json');
const seed=JSON.parse(fs.readFileSync(seedPath,'utf8'));
const modules=seed.track.modules, topics=modules.flatMap(m=>m.topics), contents=topics.flatMap(t=>t.contents), activities=topics.flatMap(t=>t.activities), materials=topics.flatMap(t=>t.materials), projects=seed.suggested_projects;
const counts={modules:modules.length,topics:topics.length,contents:contents.length,activities:activities.length,materials:materials.length,projects:projects.length};
const expected={modules:14,topics:74,contents:336,activities:74,materials:144,projects:5};
JSON.stringify(counts)===JSON.stringify(expected)?pass.push('canonical-seed-counts'):fail.push(`seed-counts:${JSON.stringify(counts)}`);
const projectIds=new Set(projects.map(p=>p.id)); topics.some(t=>t.suggested_projects.some(x=>!projectIds.has(x)))?fail.push('invalid-project-ref'):pass.push('canonical-project-topic-refs');
contents.every(c=>c.explanation&&c.example&&c.key_points?.length&&c.when_to_use&&c.pitfalls)?pass.push('amd-001-didactic-content'):fail.push('amd-001-gap');
const migrations=fs.readdirSync(path.join(root,'supabase/migrations')).filter(x=>x.endsWith('.sql')); migrations.length===10?pass.push('ten-versioned-migrations'):fail.push(`migrations:${migrations.length}`);
const runbooks=['DEPLOY.md','DATABASE_MIGRATION.md','ROLLBACK_FORWARD_FIX.md','BACKUP.md','RESTORE_DR.md','SEED_IMPORT.md','SEED_CONFLICT_TOMBSTONE.md','STORAGE_RECONCILIATION.md','COMPROMISED_SECRET.md','AUTH_INCIDENT.md','PRODUCTION_SMOKE.md'];
const missing=runbooks.filter(x=>!fs.existsSync(path.join(root,'docs/runbooks',x))); missing.length?fail.push(`missing-runbooks:${missing.join(',')}`):pass.push('eleven-runbooks');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>['.git','node_modules'].includes(e.name)?[]:e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk(root); const rel=files.map(f=>path.relative(root,f));
rel.some(f=>/^apps[\\/]api[\\/]/.test(f)||/nx\.json|turbo\.json/i.test(f))?fail.push('forbidden-extra-deployable-or-orchestrator'):pass.push('single-application-deployable');
const secretPatterns=[/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,/ghp_[A-Za-z0-9]{30,}/,/sk_live_[A-Za-z0-9]+/,/SUPABASE_SERVICE_ROLE_KEY[ \t]*=[ \t]*[^\s#]+/];
const hits=[]; for(const f of files){if(!/\.(ts|tsx|js|mjs|json|yml|yaml|md|sql|toml|sh|example)$/.test(f))continue;const t=fs.readFileSync(f,'utf8');if(secretPatterns.some(r=>r.test(t)))hits.push(path.relative(root,f));}
hits.length?fail.push(`possible-secret:${hits.join(',')}`):pass.push('static-secret-pattern-scan');
rel.some(f=>/PDI_OS_.*\.(docx|pdf)$/i.test(f))?fail.push('source-binary-in-repo'):pass.push('no-source-doc-binaries');
console.log(JSON.stringify({ok:!fail.length,pass,fail,seedSha256:crypto.createHash('sha256').update(fs.readFileSync(seedPath)).digest('hex')},null,2)); if(fail.length)process.exit(1);
