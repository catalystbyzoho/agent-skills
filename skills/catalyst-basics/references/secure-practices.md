# Secure Practices — Go-Live Security Review

Checklist for building and hosting a Catalyst app securely, by hand or with an AI agent. Source: [Secure Practices](https://docs.catalyst.zoho.com/en/getting-started/secure-practices/). Securing the app is a shared responsibility: several Catalyst defaults are open, and closing them is the developer's job.

## When to use this file

- The user asks to "secure", "harden", or "security review" a Catalyst app, or asks "is my app ready to go live?"
- Before promoting a project to Production.
- After an agent sets up Authentication, functions, Data Store tables, Stratus buckets, or AppSail endpoints for the user — run the matching section and tell the user what is still open.

Check each item against the user's real project (MCP or console). Report what is open and what to change. Do not change access settings, delete data, or turn features on or off without the user's confirmation.

## Defaults that are open

| Default | Risk | Change |
|---|---|---|
| Security Rules `authentication: optional` on every new function | Anyone with the function URL can call it, signed in or not | Set `"authentication": "required"` per function, or put the endpoints behind API Gateway with Catalyst Authentication |
| Development uses one API key for all projects | Anyone in the org with that key can call API-key-protected functions | Do not use API key authentication; use Catalyst Authentication (web) or OAuth (mobile) |
| Data Store table scope set to Global | Every signed-in user can read every row | Scope per table: user, org, or global by business need |
| Stratus bucket created with the Public template | Anyone with an object URL can open the file without signing in | Use the Authenticated template for anything sensitive |
| Public Signup enabled (it is off by default) | Anyone can create an account and reach Global-scope tables | Enable only when the app is ready for users; add Custom User Validation to approve each signup |

## 1. Access to the project (collaborators)

- **Admins** can access every project in the org with Project Owner access, including billing, profiles, and Git Integration. **Project Members** get only the projects they are added to, with the profile assigned there (Project Owner, Contributor, Viewer, or custom).
- Add collaborators as Project Members; make someone an Admin only if they need admin privileges.
- Give WRITE permission to as few people as possible, and require MFA on every collaborator account.
- Grant Data Store, Logs, and Signals permissions only to members who need them — they can contain user data.
- Grant Production Environment permission only in the profiles of members who need it.
- **Third-party integrations are org-wide.** An account integrated under Settings → Integrations is accessible to everyone in the Catalyst organization, including members of other projects. Integrate only if everyone in the org should have that access.

## 2. Access to the app (end users)

**Public Signup.** Off by default. Keep it off while the app is in development. When the app is ready to accept users, enable it (Console → Authentication → Authentication Types → Public Signup toggle). If signups must be restricted (only company emails, invited users, a waitlist), also enable [Custom User Validation](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/whitelisting/custom-user-validation/introduction/), which runs a Basic I/O function to approve or reject each signup. Custom User Validation works only while Public Signup is on, and third-party authentication setup requires Public Signup.

**Functions.** Every new function has Security Rules `authentication: optional`.
- Set `"authentication": "required"` for each function that only signed-in users should call. The flag applies to the whole function, not per method.
- For more control (routing, authentication, throttling), use API Gateway with Catalyst Authentication. Enabling API Gateway disables Security Rules, and function and web client URLs stop working until you create APIs for them.
- Remove HTTP methods a function does not use from its Security Rules definition.
- For mobile apps, use OAuth-based authentication.
- Do not use API key authentication: the Development API key is shared across all projects in the org.

**AppSail.** Security Rules and API Gateway do not apply to AppSail services, which are reached on their own AppSail URLs. The Catalyst gateway adds admin credentials to every AppSail request, including anonymous ones, so `catalyst.initialize(req)` succeeding does not mean a user is signed in. For every endpoint that needs a signed-in user, check that `getCurrentUser()` returns a user, and enforce ownership in your data calls (for example, filter by the signed-in user's ID or org), because admin-scope calls ignore table scopes and permissions. Without the check, an endpoint like `/admin` is open to anyone with the URL.

**Whitelisted domains.**
- Authorized Domains (Authentication): CORS for a domain gives it access to the app client and all function endpoints; iFrame lets it embed the app.
- Bucket CORS (Stratus): gives the domain access to the bucket's objects. Any project member with Stratus Write permission can edit it.
- Whitelist only domains you control or trust.

## 3. Data

**Data Store.**
- Set each table's scope (user, org, or global) by business need. Example: an e-commerce purchases table should be user scope so customers see only their own orders.
- Table scopes and role permissions apply only to calls made as the end user (client SDKs, or server SDK calls with `scope: 'user'`). Admin-scope server calls bypass them, so customer-facing endpoints that use admin scope must filter by the signed-in user or org themselves.
- Give the App User role only the Select, Insert, Update, and Delete permissions it needs, per table (Scopes & Permissions).
- A custom role created without its own scopes follows App User's scopes, so keeping App User minimal also limits new roles.
- Roles apply to Data Store tables and, through them, to Search and ZCQL.

**Stratus.**
- Use the **Authenticated** permission template (signed-in app users only) for sensitive objects. **Public** means anyone on the internet.
- Use custom permissions to control `GetObject`, `PutObject`, and `DeleteObject` per object or path. A deny rule overrides every matching allow rule.
- Use the `X_ZUID` and `X_ORGID` dynamic variables in object paths to limit each user or org to its own objects.
- Enable Data Encryption, and enable PII/ePHI for buckets with personal or health data.
- These permissions govern end users, not collaborators. Review bucket policies as the app grows.

**Secrets.**
- Keep secrets in environment variables, not in code — any collaborator with read access can read code. Functions, AppSail, and Slate all support environment variables.
- Slate: variables read by frontend code (for example, `VITE_*` in a React/Vite app) are built into the browser bundle and are public. Keep secrets in server-side code only (functions or AppSail), and use frontend variables only for public configuration.
- Environment variable values are encrypted at rest but shown in plain text to collaborators in the console and API responses, so restrict who has Production access.
- Use different secrets in Development and Production, and rotate API keys and secrets regularly.

## 4. Runtimes

- Build functions, AppSail services, and Slate apps on the latest supported runtime, and move off deprecated runtimes (see the [Language Runtime Support Policy](https://docs.catalyst.zoho.com/en/serverless/help/functions/runtime-support/#language-runtime-support-policy)). End-of-life runtimes stop getting security fixes.
- Slate: after changing the Node.js runtime in app settings, redeploy the app — changing the runtime does not rebuild it.
- Critical security updates are emailed to the account and posted in [Announcements](https://docs.catalyst.zoho.com/en/announcements/); all fixes are in the [Release Notes](https://docs.catalyst.zoho.com/en/release-notes/).

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| Function returns data to users who are not signed in | Security Rules `authentication` is still `optional` (the default) | Set `"authentication": "required"` for that function, or route it through API Gateway with Catalyst Authentication |
| All function and client URLs return errors right after enabling API Gateway | API Gateway disables Security Rules; no APIs exist yet | Create an API in API Gateway for each function and the web client |
| `signUp()` fails for new users | Public Signup is off (the default) | If the app is ready for users, enable Public Signup; to restrict who can join, also enable Custom User Validation |
| Strangers sign up during development and see app data | Public Signup enabled early and tables are Global scope | Turn Public Signup off until launch, or keep it on with Custom User Validation; scope tables to user or org |
| Signed-in users see other users' rows | Table scope is Global, App User has more permissions than needed, or the endpoint reads data with admin scope | Change the table scope to user or org; trim App User permissions; in admin-scope code, filter by the signed-in user or org |
| Anyone with a link can open files in a bucket | Bucket uses the Public template | Switch to Authenticated or custom permissions; use `X_ZUID`/`X_ORGID` paths for per-user files |
| AppSail endpoint answers unauthenticated requests | AppSail is not covered by Security Rules or API Gateway, and the gateway adds admin credentials to every request | Check that `getCurrentUser()` returns a user before serving the endpoint; enforce ownership in data calls |
| Function protected by an API key is called from another project | The Development API key is shared across all projects in the org | Replace API key authentication with Catalyst Authentication or OAuth |
| Secret visible to every collaborator | Secret written in code | Move it to an environment variable; restrict which collaborators can access that environment; use separate Dev and Prod values; rotate the exposed secret |
