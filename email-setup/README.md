# Email results with Google Apps Script

Every registration and every finished session is emailed to
`arditceno82@gmail.com` as an HTML table. No third-party account is needed.

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
5. Give that URL to the website, in one of two ways:
   - **Published site:** in GitHub, go to Settings, Secrets and variables,
     Actions, and add a secret named **`SUBMISSION_URL`** with the URL. The
     deploy workflow injects it automatically.
   - **Local:** create `js/config.local.js`:
     ```js
     window.NCID_LOCAL = {
       storage: { submission: { url: "PASTE_THE_/exec_URL_HERE", includeGaze: false } }
     };
     ```

The next registration and the end of the next session will arrive in your inbox
as a table.

## Notes

- The script sends from your own Gmail account, so no external service is needed.
- Emails are sent when the participant registers and when the session finishes.
- If you change the script, deploy a **new version** (Deploy, Manage deployments).
