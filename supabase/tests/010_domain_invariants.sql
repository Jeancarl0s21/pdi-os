begin;
select plan(8);
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values('10000000-0000-0000-0000-000000000001','authenticated','authenticated','foundation-a@example.invalid','',now(),now(),now());
insert into public.tracks(id,user_id,slug,title) values('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','t','Track');
insert into public.modules(id,user_id,track_id,slug,title,position) values('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','m','Module',0);
insert into public.topics(id,user_id,module_id,slug,title,position) values('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','x','Topic',0);
select throws_ok($$update public.topics set status='completed' where id='40000000-0000-0000-0000-000000000001'$$,'23514',null,'Topic cannot complete without completed Activity');
insert into public.activities(id,user_id,topic_id,title,instruction,completed_at,position) values('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','A','Do',now(),0);
update public.topics set status='completed' where id='40000000-0000-0000-0000-000000000001';
select is((select status from public.topics where id='40000000-0000-0000-0000-000000000001'),'completed','Topic completes with Activity');
update public.activities set completed_at=null where id='50000000-0000-0000-0000-000000000001';
select is((select status from public.topics where id='40000000-0000-0000-0000-000000000001'),'studying','Reopening last Activity returns Topic to studying');
insert into public.projects(id,user_id,name,publication_status) values('60000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Project','draft');
select throws_ok($$update public.projects set publication_status='published' where id='60000000-0000-0000-0000-000000000001'$$,'23514',null,'Project publication requirements are enforced');
insert into public.tasks(id,user_id,title,status,position) values
('70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','T1','backlog',0),
('70000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','T2','backlog',1);
set local role authenticated; set local request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
select lives_ok($$select public.move_task('70000000-0000-0000-0000-000000000001','done',0)$$,'Kanban move RPC succeeds for owner');
reset role;
select is((select status from public.tasks where id='70000000-0000-0000-0000-000000000001'),'done','Task moved to target status');
select is((select position from public.tasks where id='70000000-0000-0000-0000-000000000002'),0,'Origin positions compacted');
select is((select count(*)::int from public.tasks where user_id='10000000-0000-0000-0000-000000000001' and status='done'),1,'Target scope has exactly one moved task');
select * from finish(); rollback;
