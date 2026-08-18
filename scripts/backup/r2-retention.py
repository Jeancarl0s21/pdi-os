#!/usr/bin/env python3
"""Select R2 backups to retain: 7 newest daily plus 4 weekly representatives. Default dry-run."""
import argparse, json, subprocess, os, datetime as dt
p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');a=p.parse_args()
for k in ['R2_ACCOUNT_ID','R2_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY']:
    if not os.getenv(k): raise SystemExit(f'{k} required')
env=os.environ|{'AWS_ACCESS_KEY_ID':os.environ['R2_ACCESS_KEY_ID'],'AWS_SECRET_ACCESS_KEY':os.environ['R2_SECRET_ACCESS_KEY'],'AWS_DEFAULT_REGION':'auto'}
endpoint=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com"; bucket=os.environ['R2_BUCKET']
raw=subprocess.check_output(['aws','s3api','list-objects-v2','--bucket',bucket,'--prefix','daily/','--endpoint-url',endpoint,'--output','json'],env=env,text=True)
items=sorted(json.loads(raw).get('Contents',[]),key=lambda x:x['LastModified'],reverse=True)
keep={x['Key'] for x in items[:7]}; weeks=set()
for x in items[7:]:
    d=dt.datetime.fromisoformat(x['LastModified'].replace('Z','+00:00')); wk=(d.isocalendar().year,d.isocalendar().week)
    if len(weeks)<4 and wk not in weeks: weeks.add(wk);keep.add(x['Key'])
delete=[x['Key'] for x in items if x['Key'] not in keep]
print(json.dumps({'keep':sorted(keep),'delete':delete,'mode':'apply' if a.apply else 'dry-run'},indent=2))
if a:
    if os.getenv('CONFIRM_R2_PRUNE')!='YES': raise SystemExit('CONFIRM_R2_PRUNE=YES required')
    for key in delete: subprocess.check_call(['aws','s3api','delete-object','--bucket',bucket,'--key',key,'--endpoint-url',endpoint],env=env)
