# WOF Pipeline

Puzzle ingestion and pack generation pipeline for Wheel of Fortune practice app.

## Quick Start

```bash
# Install dependencies
cd pipeline
npm install

# Run tests
npm test

# Fetch puzzle data from public sources
npm run pipeline:fetch -- get wof1_20

# Ingest and create a pack
npm run pipeline:ingest -- -i "data/raw/*.txt" -p seasons_1_20
```

## CLI Commands

### Fetch Data

```bash
# List available sources
npm run pipeline:fetch -- list

# Fetch specific source
npm run pipeline:fetch -- get wof1_20

# Fetch all HTTP sources (Kaggle requires auth)
npm run pipeline:fetch -- all
```

### Ingest Puzzles

```bash
npm run pipeline:ingest -- [options]

Options:
  -i, --input <paths...>       Input file(s) or glob patterns (required)
  -p, --pack <name>            Pack name (required)
  -s, --seed <string>          RNG seed (default: "default")
  --categories-include <list>  Comma-separated categories to include
  --categories-exclude <list>  Comma-separated categories to exclude
  --round-types <list>         Round types: MAIN,TOSSUP,BONUS (default: "MAIN")
  --min-length <int>           Minimum letter count
  --max-length <int>           Maximum letter count
  --difficulty-min <float>     Minimum difficulty (0-1)
  --difficulty-max <float>     Maximum difficulty (0-1)
  -l, --limit <int>            Limit number of puzzles
  -n, --dry-run                Print summary without writing files
  --strict                     Fail on validation errors
  -o, --outdir <path>          Output directory (default: "data")
```

## Input Formats

### CSV

Standard CSV with header row. Recognized column names:
- Phrase: `phrase`, `answer`, `puzzle`, `word`, `solution`
- Category: `category`, `cat`, `type`
- Round type: `round_type`, `roundtype`, `round`

```csv
category,answer
PHRASE,PRACTICE MAKES PERFECT
FOOD & DRINK,CHOCOLATE CHIP COOKIES
```

### Plain Text

One puzzle per line. Optional tab-separated format:

```
# Comments are ignored
PHRASE	A PENNY FOR YOUR THOUGHTS
PLACE	TIMES SQUARE
JUST THE PHRASE HERE
```

### JSON

Array of objects or wrapped in `{ puzzles: [...] }`:

```json
[
  { "phrase": "WHEEL OF FORTUNE", "category": "TITLE" },
  { "phrase": "PIZZA DELIVERY", "category": "THING" }
]
```

### JSONL

One JSON object per line:

```jsonl
{"phrase": "WHEEL OF FORTUNE", "category": "TITLE"}
{"phrase": "PIZZA DELIVERY", "category": "THING"}
```

## Examples

### Create a pack from multiple sources

```bash
npm run pipeline:ingest -- \
  -i "data/raw/*.csv" \
  -i "data/raw/*.txt" \
  -p all_puzzles \
  --seed stable_v1
```

### Filter by category

```bash
# Only PHRASE and THING categories
npm run pipeline:ingest -- \
  -i "data/raw/puzzles.csv" \
  -p phrases_only \
  --categories-include PHRASE,THING
```

### Create a hard puzzle pack

```bash
npm run pipeline:ingest -- \
  -i "data/raw/*.csv" \
  -p hard_mode \
  --difficulty-min 0.6 \
  --limit 100
```

### Dry run to preview

```bash
npm run pipeline:ingest -- \
  -i "data/raw/*.csv" \
  -p test \
  --dry-run
```

## Output

### Pack File (`data/packs/<name>.json`)

```json
{
  "pack_id": "my_pack",
  "name": "My Pack",
  "created_at": "2024-01-01T00:00:00.000Z",
  "license_note": "User-imported/generated pack",
  "stats": {
    "count": 100,
    "categories": { "PHRASE": 50, "THING": 30, "PLACE": 20 },
    "round_types": { "MAIN": 100 }
  },
  "puzzles": [...]
}
```

### Report File (`data/reports/<name>-report.json`)

Contains statistics about the ingestion:
- Input files processed
- Rows read / puzzles kept
- Skipped counts by reason
- Duplicates removed
- Category distribution
- Top 20 hardest/easiest puzzles

## Canonical Categories

The pipeline maps various category names to these canonical values:

- `PHRASE`
- `FOOD_AND_DRINK`
- `PLACE`
- `WHAT_ARE_YOU_DOING`
- `BEFORE_AND_AFTER`
- `SAME_NAME`
- `TITLE`
- `PERSON`
- `EVENT`
- `AROUND_THE_HOUSE`
- `THING`
- `OCCUPATION`
- `LIVING_THING`
- `ON_THE_MAP`
- `FICTIONAL_CHARACTER`
- `OTHER`

## Difficulty Scoring

Difficulty is computed as a score from 0-1 based on:

- **Letter count** - longer phrases are harder
- **Vowel ratio** - very low (<20%) or very high (>60%) vowel ratios are harder
- **Rare letters** - J, Q, X, Z add difficulty
- **Unique letters** - more unique letters = harder
- **Common patterns** - "ING" endings, common words reduce difficulty

## Kaggle Datasets

To use Kaggle datasets:

1. Install Kaggle CLI: `pip install kaggle`
2. Get API credentials from https://www.kaggle.com/settings
3. Save to `~/.kaggle/kaggle.json` or set `KAGGLE_API_TOKEN` env var

```bash
# Fetch Kaggle dataset
npm run pipeline:fetch -- get kaggle_answers
npm run pipeline:fetch -- get kaggle_bonus
```

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build TypeScript
npm run build
```
