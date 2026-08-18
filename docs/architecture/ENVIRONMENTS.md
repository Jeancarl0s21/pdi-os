# Environment Contract

| Boundary  | Local                   | Non-Prod             | Production          |
| --------- | ----------------------- | -------------------- | ------------------- |
| Web       | Next.js local           | Vercel Preview       | Vercel Production   |
| Supabase  | CLI stack + Mailpit     | independent project  | independent project |
| Data      | fake/test               | test only            | real                |
| Secrets   | local secret file/store | Non-Prod only        | Production only     |
| R2 backup | none required           | drill/test as needed | encrypted off-site  |

Rules:

- Non-Prod and Production never share Supabase database, Auth, Storage, project reference, keys, URLs, or administrative credentials.
- Preview must never point at Production.
- Production is not created during local Foundation bootstrap and requires explicit authorization.
- Service-role/database/R2/Vercel credentials are administrative and never enter the normal browser/runtime request path.
