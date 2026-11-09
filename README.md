# Independent product research

Prepared for Nathan Watkins · November 6, 2026.

Evidence-led study of Pieter Levels, five contrasting founders, customer reviews, and Solara/Open Ping/CutelyAskMe. Financial claims are dated and qualified; recommendations are experiments, not forecasts.

- [Full report](report.md)
- [Reusable prompt and research outline](research-brief.md)
- [Source register](sources.md) / [JSON](sources.json)
- [Consequential claim ledger](claims.json)
- [Experiment backlog](experiments.json)

## Website

Static HTML, CSS and JavaScript; no build dependencies, tracking, backend or secrets. Serve the directory with any static server (for example `python3 -m http.server 8000`). Open index.html through that server so report.md can load.

Vercel project: indie-product-research.
The deployment is protected with Vercel Authentication for all environments; keep that protection when redeploying.

Edit report.md to update the site. Use regular Markdown links and tables; the small local renderer supports the report's formatting. Update source dates and claim qualifications when changing evidence. The report's source links point to the original material; no paid book text or full scraped articles are included.

## License

MIT, see [LICENSE](LICENSE).
