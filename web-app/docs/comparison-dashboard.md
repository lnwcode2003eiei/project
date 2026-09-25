# PDF comparison dashboard

- POST /api/admin/comparison requires admin authentication and all-branch access.
- Local Poppler text extraction; local Tesseract Thai/English for pages with little extractable text. No external OCR service or saved reports. Temporary files are removed in finally; original uploads are not stored in the public uploads directory.
- Limit 10 MiB, 30 pages, at most 10 OCR pages, 5,000 candidate rows. One PDF job at a time, process and total timeouts; no shell interpolation. Use maintained container packages.
- Upload only documents listing successful candidates, not mixed pass/fail rosters. The application cannot infer the meaning of arbitrary PDFs.
- Supported extraction: title-led or numbered name/surname rows. Arbitrary columns, broken font encodings, names wrapped across lines and prose cannot be interpreted reliably. OCR rows are displayed as unresolved and excluded from all percentages. Unsupported rows may not be detected at all.
- All-time site data is compared to this one upload. No academic-year, exam-round selection or review/edit-name screen.
- Case, prefixes and repeated whitespace are normalized; identical full names collapse into one name group, not an identity claim. Similar names are flagged, not merged. Anonymous/partial website names are excluded and counted separately.
- Visitor-to-interest = intersection(V,I)/V. Interest-to-pass = intersection(I,P)/I. Full path = intersection(V,I,P)/V. Outside = P names absent from both V/I and without a flagged near match, divided by P. P contains only names actually extracted as usable, not the verified size of the entire PDF. Zero denominator displays a dash. No-match does not prove non-visitation or failure.
- No real roster supplied for acceptance testing yet. Validate against the user's actual PDF before treating percentages as official reporting.

Tests: node --test server/comparison.test.js
Runtime: docker compose -f docker-compose.yml -f compose.local.yml up -d --build --no-deps backend frontend
