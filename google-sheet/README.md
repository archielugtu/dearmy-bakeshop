# Google Sheet setup

The bakery edits its menu and opening hours in a Google Sheet. Clicking **Website > Publish to website**
rebuilds the site (about 2 minutes). Nothing else on the site is in the Sheet: headings, story copy and
the address stay in `src/data/site.ts`.

```
Owner edits Sheet -> Website > Publish -> host deploy hook -> site build reads Sheet (Apps Script web app) -> live
```

If the Sheet can't be read, or has no usable bakes, the build **fails on purpose** and the host keeps serving
the last good site.

## One-time setup (you, the web person)

### 1. Create the Sheet

Two tabs, header row exactly as below. Column order and capitalisation don't matter.

**Bakes**

| Name | Type | Price | Description | For dear my | Photo | Photo description | On website? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Butter Croissant | Pastries | 5.50 | Crisp outside, soft inside. | early bird | (Drive link) | Close-up of croissants | TRUE |

- **Type**: dropdown with `Bread`, `Pastries`, `Cakes and slices`, `Cookies` (Data > Data validation).
- **Price**: a number. `$5.50` also works.
- **For dear my**: finishes the stamp line "for dear my ___". Blank falls back to "favourite person".
- **Photo**: paste a Google Drive share link, or any public image URL. See "Photos" below.
- **On website?**: tick box (Insert > Tick box). Blank or unticked means hidden. This is how the owner sells out or retires an item without deleting it.

**Hours**

| Days | Time |
| --- | --- |
| Monday | Closed |
| Tuesday to Friday | 8am – 3pm |

### 2. Add the script

1. In the Sheet: **Extensions > Apps Script**.
2. Replace the contents with [`Code.gs`](./Code.gs). Save.
3. **Project Settings > Script properties** (gear icon), add:
   - `API_KEY`: a long random string (e.g. `openssl rand -hex 24`).
   - `DEPLOY_HOOK_URL`: from your host (step 4).
4. **Deploy > New deployment > Web app**: Execute as **Me**, access **Anyone**. Copy the `/exec` URL.
   The key in `API_KEY` is what protects it. Re-deploy (**Manage deployments > Edit > New version**) whenever you change `Code.gs`.
5. Reload the Sheet. A **Website** menu appears. The first click asks for permission (the script reads the Sheet and calls the deploy hook).

### 3. Give the site the URL and key

Build environment variables on the host (and in a local `.env` for testing, see `.env.example`):

```
SHEET_API_URL=https://script.google.com/macros/s/.../exec
SHEET_API_KEY=<same as API_KEY>
```

### 4. Deploy hook

- Cloudflare Pages: Settings > Builds & deployments > **Deploy hooks**.
- Netlify: Site settings > Build & deploy > **Build hooks**.
- Vercel: Settings > Git > **Deploy Hooks**.

Paste its URL into the `DEPLOY_HOOK_URL` script property. Also add a nightly scheduled rebuild if the host supports it, as a safety net.

### 5. Share with the owner

Share the Sheet with the owner as **Editor**. Share the Drive photo folder with them too.

## Photos

The build downloads each photo, crops it to a square, and converts it to small webp files. Owner steps:

1. Upload the photo to the shared Drive folder.
2. Right-click > **Share** > General access: **Anyone with the link** (Viewer).
3. **Copy link**, paste into the **Photo** column.

Tips for the owner: bright, close-up, one item per photo, under ~5MB. Fill **Photo description** (one short sentence, helps blind visitors).

A photo that can't be loaded (file not shared, bad link) shows the DearMy logo instead and logs a warning in the build. The rest of the update still goes out.

## Owner's guide (copy for the client)

- **Change a price or description**: edit the cell, then Website > Publish to website.
- **Add a bake**: add a row, fill every column, tick **On website?**.
- **Sold out or seasonal**: untick **On website?**. The row stays for next time.
- **Check before publishing**: Website > **Check my sheet** lists rows that will be left off, and why.
- Changes are live about 2 minutes after publishing. Nothing changes on the site until you publish.

## Rows that get skipped

A ticked row is left off the website (and listed in **Check my sheet**) if it has no name, no description, a price that isn't a number, or a Type not in the list above. Missing photo only means the logo placeholder shows.

## Testing locally

```bash
cp .env.example .env     # fill in SHEET_API_URL and SHEET_API_KEY
npm run dev              # reads the Sheet at startup; restart to refetch
```

With both variables unset the site builds with the sample menu in `src/data/site.ts`.

## Adding a new category

Categories are fixed in `src/data/site.ts` (`categories`) because they drive the filter buttons. To add one, add it there and in the `types` list in `Code.gs`, then redeploy the script.
