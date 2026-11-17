# DearMy Bakeshop website

Homepage for DearMy Bakeshop, 181 Madras Street, Christchurch (Boxed Quarter).
Built with [Astro](https://astro.build) as a static site: plain HTML and CSS, with one small script.

## Run it

```bash
npm install
npm run dev      # local preview at http://localhost:4321
npm run build    # production build into dist/
```

## Change the content

**Menu and opening hours** live in a Google Sheet the bakery edits itself; the build reads them (setup in
[`google-sheet/README.md`](google-sheet/README.md)). With `SHEET_API_URL` / `SHEET_API_KEY` unset (see
`.env.example`) the site builds with the sample `bakes` and `hours` in `src/data/site.ts`.

Everything else lives in `src/data/site.ts`.

| To change | Edit |
| --- | --- |
| Address, phone, Instagram link | `business` |
| Words that cycle through the blank | `blank.words` |
| Headings, intro and story copy | `copy` |
| Sample opening hours (used without the Sheet) | `hours` |
| Sample bakes (used without the Sheet) | `bakes` |
| Hero and story photos | `photos` |
| Page title and search description | `seo` |

Photos accept either an Unsplash photo id (`unsplashId`) or a file in `public/`
(`src: '/photos/croissant.jpg'`). The logo is `public/logo.png`; the smaller
`logo-*.webp`, favicon and `og.jpg` files are resized copies of it.

## Before launch

The confirmed business details (name, tagline, address, phone) are in place.
Everything else is sample content, marked `PLACEHOLDER` in `src/data/site.ts`:

- [ ] Instagram account: set `business.instagram.url` and `handle`, then `isPlaceholder: false`
- [ ] Opening hours: replace `hours.rows`, then `isPlaceholder: false`
- [ ] Menu: replace `bakes` with real products and prices
- [ ] Photos: replace the Unsplash stock photos with the bakery's own
- [ ] Copy: review the draft wording in `copy`
- [ ] Set `showPlaceholderNotes` to `false` to hide the on-page "sample" notes
- [ ] Set `site` in `astro.config.mjs` to the real web address

## Where things are

```
src/data/site.ts        copy, business details, sample menu
src/data/sheet.ts       loads menu + hours from the Google Sheet at build time
google-sheet/           Apps Script (Code.gs) and Sheet setup guide
src/pages/index.astro   page assembly
src/components/         one file per section, plus Photo, Doodle, Smile, Postmark
src/styles/global.css   all styles and design tokens
src/scripts/main.js     the blank, bake filters, order note
```
