#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const graceMs=7*24*60*60*1000;
const apply=process.argv.includes('--apply');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl=process.env.SUPABASE_DB_URL;
if(!url||!key||!dbUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_DB_URL are required in the isolated admin environment');
if(apply && (process.env.CONFIRM_STORAGE_DELETE!=='YES'||process.env.BACKUP_HEALTHY!=='YES')) throw new Error('--apply requires CONFIRM_STORAGE_DELETE=YES and BACKUP_HEALTHY=YES');

const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const pg=(await import('pg')).default; const client=new pg.Client({connectionString:dbUrl}); await client.connect();
const refs=new Map<string,Set<string>>([['portfolio-assets',new Set()],['project-covers',new Set()],['evidence-files',new Set()]]);
try{
  const profile=await client.query("select user_id,avatar_path from public.portfolio_profiles where avatar_path is not null");
  for(const r of profile.rows) refs.get('portfolio-assets')!.add(r.avatar_path);
  const covers=await client.query("select user_id,cover_path from public.projects where cover_path is not null");
  for(const r of covers.rows) refs.get('project-covers')!.add(r.cover_path);
  const evidence=await client.query("select user_id,file_path from public.evidences where kind='file' and file_path is not null");
  for(const r of evidence.rows) refs.get('evidence-files')!.add(r.file_path);
} finally { await client.end(); }

async function listRecursive(bucket:string,prefix=''):Promise<{name:string,updated_at?:string,created_at?:string}[]> {
  const out:any[]=[]; let offset=0;
  while(true){ const {data,error}=await supabase.storage.from(bucket).list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}}); if(error) throw error; if(!data?.length) break;
    for(const item of data){ const full=prefix?`${prefix}/${item.name}`:item.name; if(item.id) out.push({...item,name:full}); else out.push(...await listRecursive(bucket,full)); }
    if(data.length<100) break; offset+=data.length;
  } return out;
}

const report:any={missing:[],orphans:[],eligibleForDelete:[],deleted:[]};
for(const [bucket,referenced] of refs){
  const objects=await listRecursive(bucket); const names=new Set(objects.map(o=>o.name));
  for(const path of referenced) if(!names.has(path)) report.missing.push({bucket,path,severity:'critical',action:'recover-from-backup-first'});
  for(const object of objects) if(!referenced.has(object.name)){
    const stamp=object.updated_at||object.created_at; const age=stamp?Date.now()-Date.parse(stamp):0; const entry={bucket,path:object.name,ageDays:Math.floor(age/86400000)}; report.orphans.push(entry);
    if(age>=graceMs){report.eligibleForDelete.push(entry); if(apply){const {error}=await supabase.storage.from(bucket).remove([object.name]);if(error)throw error;report.deleted.push(entry);}}
  }
}
console.log(JSON.stringify({mode:apply?'apply':'dry-run',graceDays:7,...report},null,2));
if(report.missing.length) process.exitCode=2;
