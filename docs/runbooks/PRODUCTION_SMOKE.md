# Production Smoke

Non-destructive checks only, after explicit Production authorization and deploy.

- Public landing responds successfully.
- Unauthenticated private route redirects to Login.
- Direct guessed Draft/private Project access is unavailable.
- Published public projection contains only allowed public DTO fields.
- Archived Published Project is not public-eligible.
- CurrentlyStudying requires studying + explicit authorization + active Topic/Module.
- Security headers are present.
- No authenticated/private response is shared/public cached.

Record release/commit, deployment ID, timestamp and pass/fail. Do not create/edit user data as part of smoke unless a dedicated disposable fixture is explicitly approved.
