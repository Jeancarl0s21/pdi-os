import { describe,expect,it } from 'vitest';
import { loadSeed } from '../src/load';
import { buildManifest,manifestCounts } from '../src/manifest';

describe('Roadmap Seed V1.2 manifest',()=>{
  it('preserves canonical counts and unique identities',async()=>{
    const seed=await loadSeed(); const manifest=buildManifest(seed); const c=manifestCounts(manifest);
    expect(c).toMatchObject({tracks:1,modules:14,topics:74,contents:336,activities:74,materials:144,projects:5});
    expect(new Set(manifest.map(x=>`${x.entityType}:${x.sourceKey}`)).size).toBe(manifest.length);
  });
  it('maps suggested projects only from Topic references',async()=>{
    const seed=await loadSeed(); const manifest=buildManifest(seed);
    const expected=new Set<string>(); for(const m of seed.track.modules) for(const t of m.topics) for(const p of t.suggested_projects) expected.add(`PTMAP:${p}:${t.id}`);
    expect(new Set(manifest.filter(x=>x.entityType==='project_topics').map(x=>x.sourceKey))).toEqual(expected);
  });
  it('materializes didactic body as payload, not executable code',async()=>{
    const seed=await loadSeed(); const content=buildManifest(seed).find(x=>x.entityType==='contents');
    expect(content?.payload).toHaveProperty('didactic_payload'); expect(content?.payload).toHaveProperty('payload_version',1);
  });
});
