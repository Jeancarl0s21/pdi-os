#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY; const inDir=process.argv[2];
if(!url||!key||!inDir) throw new Error('Usage: import-storage.ts <input-dir> with target Supabase admin env');
if(process.env.CONFIRM_STORAGE_RESTORE!=='YES') throw new Error('Set CONFIRM_STORAGE_RESTORE=YES for explicit restore');
const sb=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const buckets=['portfolio-assets','project-covers','evidence-files'];
async function files(root:string):Promise<string[]>{let out:string[]=[];for(const e of await fs.readdir(root,{withFileTypes:true}).catch(()=>[])){const p=path.join(root,e.name);out=e.isDirectory()?out.concat(await files(p)):out.concat(p);}return out;}
for(const bucket of buckets){const root=path.join(inDir,bucket);for(const file of await files(root)){const object=path.relative(root,file).split(path.sep).join('/');const body=await fs.readFile(file);const {error}=await sb.storage.from(bucket).upload(object,body,{upsert:true});if(error)throw error;}}
