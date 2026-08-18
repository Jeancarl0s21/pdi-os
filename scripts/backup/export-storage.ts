#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY; const outDir=process.argv[2];
if(!url||!key||!outDir) throw new Error('Usage: export-storage.ts <output-dir> with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
const sb=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const buckets=['portfolio-assets','project-covers','evidence-files'];
async function walk(bucket:string,prefix=''):Promise<string[]>{
  const out:string[]=[];let offset=0;while(true){const {data,error}=await sb.storage.from(bucket).list(prefix,{limit:100,offset});if(error)throw error;if(!data?.length)break;for(const x of data){const full=prefix?`${prefix}/${x.name}`:x.name;if(x.id)out.push(full);else out.push(...await walk(bucket,full));}if(data.length<100)break;offset+=data.length;}return out;
}
for(const bucket of buckets){for(const object of await walk(bucket)){const {data,error}=await sb.storage.from(bucket).download(object);if(error)throw error;const dest=path.join(outDir,bucket,object);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,Buffer.from(await data.arrayBuffer()));}}
