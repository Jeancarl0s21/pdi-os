begin;
select plan(5);
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('10000000-0000-0000-0000-000000000011','authenticated','authenticated','rls-a@example.invalid','',now(),now(),now()),
('10000000-0000-0000-0000-000000000012','authenticated','authenticated','rls-b@example.invalid','',now(),now(),now());
insert into public.tasks(id,user_id,title,status,position) values
('70000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000011','A','backlog',0),
('70000000-0000-0000-0000-000000000012','10000000-0000-0000-0000-000000000012','B','backlog',0);
set local role authenticated; set local request.jwt.claim.sub='10000000-0000-0000-0000-000000000011';
select is((select count(*)::int from public.tasks),1,'User A sees only own Task');
select is((select title from public.tasks),'A','User A sees Task A');
select is((select count(*)::int from public.tasks where id='70000000-0000-0000-0000-000000000012'),0,'User A cannot read User B Task');
select throws_ok($$update public.tasks set title='cross' where id='70000000-0000-0000-0000-000000000012'; select public.move_task('70000000-0000-0000-0000-000000000012','done',0)$$,'P0002',null,'Owner check blocks cross-user RPC');
reset role; set local role anon;
select throws_ok($$select count(*) from public.tasks$$,'42501',null,'Anonymous raw domain read is denied');
select * from finish(); rollback;
