# Daily Instagram workflow

`workflow.json` is an n8n importable starting workflow. It runs daily at 09:00 in the n8n instance timezone, reads the first `queued` product from the `Products` sheet, generates a square image and Groq caption, uploads the image, publishes through the Meta Graph API, marks the row published, and appends a history row. It is inactive until credentials and IDs are configured. No post was published as part of this implementation.

## Setup

1. Start n8n with `docker compose up -d` and open `http://localhost:5678`.
2. Import `workflow.json`. Set the workflow timezone in n8n and change the schedule if needed.
3. Create Google Sheets OAuth2 credentials in n8n; replace the three `SET_GOOGLE_SHEETS_CREDENTIAL_ID` references with the saved credential ID. Create tabs with the exact headers below. Share the spreadsheet with the OAuth account.
4. Configure the environment values from `.env.example` in the n8n service and restart it. n8n may require enabling `$env` access in its security settings for expressions. Restrict access to the workflow editor.
5. Create a Cloudinary unsigned upload preset limited to the `califnco-instagram` folder. Use its name for `CLOUDINARY_UNSIGNED_UPLOAD_PRESET`; never expose Cloudinary API secrets in a client.
6. Configure Meta Instagram Graph API access for a professional Instagram account linked to a Facebook Page. Supply a valid publishing token and Instagram business account ID. Token permissions, app review, token expiry and account eligibility are controlled by Meta.
7. Run manually once with a non-production test row, inspect each node's output, then activate the schedule. Set n8n execution retention and failure alerts in the instance settings.

## Sheets

Products tab headers: `productId | name | productUrl | status | imageUrl | instagramMediaId | postedAt | description`. Put one product per row and set status to `queued`. The workflow marks it `published` after Meta returns a media ID so it will not be selected again. History tab headers: `productId | name | productUrl | imageUrl | caption | mediaIdAndTimestamp`.

The workflow's Instagram Graph API version is a configuration point and should be updated to the version supported by the Meta app at activation time. Pollinations is an unofficial free image endpoint and may rate-limit or change; replace that node if its availability is insufficient. Import `error-workflow.json`, configure its SMTP credential and the administrator address, then select it as the main workflow's error workflow. Retry failed executions from n8n after correcting the cause. Avoid automatic retries of the final publish request if Meta may have accepted a request whose response was lost; inspect the media account first to avoid duplicates.
