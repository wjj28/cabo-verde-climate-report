#!/usr/bin/env bash
# Builds every microsite from the one template into dist/:
#   dist/          Climate of Cabo Verde (REPORT=main)
#   dist/cities/   Climate and Cities: Praia (REPORT=cities)
# Each site gets its pages, search index and PDFs, and is checked for accessibility.
# Usage: SITE=https://user.github.io BASE=/repo/ bash scripts/build-all.sh   (SKIP_A11Y=1 to skip the audit)
set -euo pipefail
export SITE="${SITE:-https://example.org}"
MAIN_BASE="${BASE:-/}"
CITIES_BASE="${MAIN_BASE%/}/cities/"

build() { # $1 report, $2 out dir, $3 base
  REPORT="$1" OUT_DIR="./$2" BASE="$3" npx astro build
  npx pagefind --site "$2"
}

echo "== Climate of Cabo Verde"
build main dist "$MAIN_BASE"
REPORT=main OUT_DIR=./dist BASE="$MAIN_BASE" node scripts/make-pdfs.mjs
build main dist "$MAIN_BASE"   # again, so the downloads page shows PDF sizes

echo "== Climate and Cities: Praia"
build cities dist-cities "$CITIES_BASE"
REPORT=cities OUT_DIR=./dist-cities BASE="$CITIES_BASE" node scripts/make-pdfs.mjs
build cities dist-cities "$CITIES_BASE"
mkdir -p dist-cities/pdf && cp -r data/pdf-cities/. dist-cities/pdf/
rm -rf dist-cities/admin   # one editing dashboard, on the main site, manages the content

if [ "${SKIP_A11Y:-0}" != "1" ]; then
  echo "== Accessibility"
  OUT_DIR=dist BASE="$MAIN_BASE" node scripts/a11y.mjs
  OUT_DIR=dist-cities BASE="$CITIES_BASE" node scripts/a11y.mjs
fi

rm -rf dist/cities && mkdir -p dist/cities && cp -r dist-cities/. dist/cities/
echo "== Done: dist/ (main) and dist/cities/"
