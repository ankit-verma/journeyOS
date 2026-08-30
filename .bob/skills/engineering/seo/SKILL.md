---
name: seo
description: SEO audit, optimisation, and migration-safety skill for modern web applications and commerce platforms.
---

# SEO Skill

## Objective
Audit, optimise, and protect search engine visibility across builds, migrations, and ongoing development.

## Steps
1. **Audit** — crawl site for technical SEO issues: missing titles, duplicate content, broken links, missing canonical, noindex errors.
2. **Performance** — Core Web Vitals are ranking signals: LCP < 2.5s, INP < 200ms, CLS < 0.1.
3. **Structure** — validate schema markup (Product, BreadcrumbList, Organization, FAQPage, Review).
4. **Content** — confirm unique title (< 60 chars) and meta description (< 160 chars) per page.
5. **Crawlability** — robots.txt, sitemap.xml up to date; no accidental noindex in production.
6. **Links** — internal linking structure; canonical tags; hreflang for multi-language.
7. **Migration safety** — 301 redirects for all changed/removed URLs; validate no organic traffic loss.
8. **Monitor** — Google Search Console / Bing Webmaster Tools: crawl errors, impressions, rankings.
9. **Report** — prioritised findings with business impact estimate (traffic at risk).

## Migration SEO checklist (critical — must complete before cutover)
- [ ] URL mapping document: every old URL → new URL or 301 redirect target
- [ ] 301 redirects configured in CDN/server (not JavaScript redirects — crawlers don't always follow)
- [ ] Canonical tags pointing to correct URLs on new platform
- [ ] XML sitemap updated and submitted to GSC
- [ ] Robots.txt verified — no `Disallow: /` on production
- [ ] Page titles, meta descriptions, and H1s preserved or improved (not removed)
- [ ] Structured data (schema.org) carried over for product/collection pages
- [ ] Image alt text preserved

## Platform-specific
- **a commerce platform**: use Online Store > Preferences for title/description; URL redirects in Navigation > URL Redirects; a commerce platform auto-redirects on product handle change
- **Next.js/headless**: use `next/head` or App Router metadata API; canonical via `<link rel="canonical">`; generate sitemap.xml dynamically

## Quality gate
- Zero noindex tags on pages that should be indexed
- All redirects return 301 (not 302, not 200, not 404)
- Core Web Vitals pass Google's "Good" thresholds
- GSC shows no spike in crawl errors post-launch

Never fabricate rankings, traffic data, or tool results.
