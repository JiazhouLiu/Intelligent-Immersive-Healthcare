# Towards Intelligent Immersive Healthcare

Companion website for **Towards Intelligent Immersive Healthcare: A Systematic Review on the Integration of AI and XR in Medical Applications**.

The site is plain HTML, CSS and JavaScript. It needs no build step, package installation, API keys or backend. All website assets are included.

## Preview locally

From this directory, run:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). Serve the folder over HTTP; opening `index.html` directly from disk may prevent the browser from fetching the CSV. The separate `ai-xr-healthcare-preview.html` deliverable embeds its data and assets and can be opened directly.

## Publish on GitHub Pages

1. Create a public repository, for example `ai-xr-healthcare-review`.
2. Upload this folder's contents to the repository root. Keep `index.html` at the root, with `style.css`, `paper-viewer.js`, `paperlist.csv` and the `assets` folder alongside it.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select **main** and **/(root)**, then save.

The project URL will follow `https://YOUR-USERNAME.github.io/ai-xr-healthcare-review/`.

Official instructions: [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) and [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Paper overview, Sankey figure, integration taxonomy, evidence summary, methodology and catalogue |
| `style.css` | Responsive styling, print rules and accessible focus states |
| `paper-viewer.js` | CSV loading, search, combined filters, sorting, column selection and figure zoom |
| `paperlist.csv` | The 41 included studies transcribed from the supplied manuscript |
| `assets/review-paper.pdf` | The manuscript supplied for this website |
| `assets/integration-map.svg` | Scalable rendering of the supplied figure; its data and layout are preserved |
| `assets/integration-map.pdf` | The original supplied figure |

## Data provenance

- The overview, research questions, abstract, counts and methodological details come from the supplied manuscript.
- Catalogue membership and the AI method/function fields reproduce **Table 2**.
- XR type and hardware categories reproduce **Table 3**. These preserve the paper's grouping, including its classification of screen-based systems.
- Titles, citations and DOI links come from the reference list. Reference identifiers such as `[14]` match the manuscript's bibliography. Acronym capitalisation in displayed titles has been normalised.
- The catalogue contains 41 unique studies. XR counts reconcile to VR 22, AR/MR 17, both AR and VR 2. The seven AI method counts reconcile to 13, 11, 7, 4, 2, 2 and 2.
- Reference `[51]` has a 2024 journal-volume year but an online publication date of **7 January 2025**. The catalogue uses 2025 for its Year field, matching the review's annual totals. Its citation retains the manuscript's bibliographic text. The publisher date is documented in that row's Data Source field and on the [publisher page](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2024.1504190/full).
- Domain and readiness counts are the review's aggregate results. Per-study clinical domain, integration mode, sample size, outcomes and TRL were not inferred from titles or reconstructed from aggregate counts.
- The earlier human-values-in-XR example dataset is not used in this website.

## Content to add when available

1. Author names in publication order, affiliations, personal links and a corresponding-author contact if desired. The supplied manuscript has no author list.
2. The supplementary extraction/coding spreadsheet, to add per-study domains, integration modes, sample sizes, outcomes and TRLs.
3. The public paper DOI or preprint link and final publication details, when available. Replace the manuscript PDF with the version you want readers to access.

## Updating the catalogue

Edit `paperlist.csv` in a CSV editor or spreadsheet application and save as UTF-8 CSV. Keep the header `Paper Title`; other existing headers should be retained unless intentionally changing the catalogue schema. Quote cells containing commas, line breaks or double quotes according to standard CSV rules.

The default visible columns are reference, title, year, AI method, XR technology and paper link. Readers can show all remaining fields through **Columns**. Search covers every field, including fields hidden from the table. Main filters are Year, XR Technology and AI Method; **More filters** exposes AI Function and XR Hardware. The viewer also recognises `Clinical Domain`, `Integration Mode` and `TRL` columns if supplied later. Semicolon-separated categorical values are treated as individual filter options.

No external fonts, scripts or analytics are loaded. PDF links in the catalogue use the supplied DOI URLs rather than assuming individual article PDFs have been uploaded.
