# Email results with Google Apps Script

Every finished session is emailed **once** to `arditceno82@gmail.com` as an HTML
table. No third-party account is needed.

The table includes: **Name and surname, ID, Profession, Expertise, Age**, the
results per level and version, and every answer.

## Steps

1. Go to https://script.google.com and click **New project**.
2. Delete the sample code, then open [`Code.gs`](Code.gs), copy all of it, and
   paste it in the editor.
3. Click **Deploy** then **New deployment**.
   - Select type: **Web app**
   - Description: `ncid`
   - **Execute as: Me**
   - **Who has access: Anyone**
4. Click **Deploy**, authorise the script, and copy the **Web app URL**
   (it ends with `/exec`).
5. Set the admin password in **Project Settings → Script properties**
   (`ADMIN_PASSWORD`, or run `setupAdminPassword()` once). **No submission
   token is used**; the endpoint is public and deduplicated by the script.
6. For local testing, create `js/config.local.js` (gitignored):
   ```js
   window.NCID_LOCAL = {
     storage: {
       submission: {
         fallbackUrl: "PASTE_THE_/exec_URL_HERE",
         includeGaze: false
       }
     }
   };
   ```

The next finished session will arrive **once** in your inbox as a table.

## Notes

- The script sends from your own Gmail account, so no external service is needed.
- Emails are sent **once**, when the session finishes.
- Retries and resends are deduplicated: the script stores a `sent_<submission_id>`
  marker and a `sent_id_<id_anonim>` marker in Script Properties, so one
  participant can never produce two emails.
- If you change the script, deploy a **new version** (Deploy, Manage deployments).
- **Never hardcode the admin password** in `Code.gs`. Store it in Script
  properties (`ADMIN_PASSWORD` or the salted `ADMIN_PASSWORD_HASH`). If it was
  ever shared or committed, rotate it immediately.
