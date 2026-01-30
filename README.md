# Chapel Planner

A web application for managing chapel services, scheduling clergy and participants, looking up lectionary readings (Common Worship and Book of Common Prayer), and tracking hospitality arrangements. Built with SvelteKit, SQLite, and Tailwind CSS.

## Features

- **Service management** — create, edit, and schedule chapel services (Choral Evensong, Sung Eucharist, Compline, Morning Prayer, and more)
- **Role assignment** — assign preachers, officiants, celebrants, readers, and other roles with invitation status tracking
- **Lectionary lookup** — daily readings for both Common Worship (CW) and Book of Common Prayer (BCP) traditions, covering principal services, morning prayer, evening prayer, daily eucharist, and second/third services
- **Liturgical calendar** — automatic computation of Easter, moveable feasts, liturgical seasons, colours, and year cycles (A/B/C for the Revised Common Lectionary; 1/2 for the daily office)
- **People directory** — contact details, institution affiliation, college membership, dietary needs
- **Hospitality tracking** — accommodation, meals, parking, and expenses for visiting clergy
- **Service blocks** — group services into terms or sermon series
- **Hymn and music management** — link hymns (NEH) and other music to services by position in the liturgy
- **Calendar view** — monthly overview of scheduled services
- **Export** — JSON export shaped for Typst typesetting (term cards, service sheets)

## Technology stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 2 |
| Language | TypeScript 5 |
| UI | Svelte 5, Skeleton Labs 3, Tailwind CSS 4 |
| Database | SQLite via Drizzle ORM (better-sqlite3) |
| Build | Vite 7 |
| Deployment | Node.js adapter (Docker-ready) |

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Database setup

Push the Drizzle schema to create the SQLite database, then seed the lectionary and hymn data:

```bash
npm run db:push
npm run db:seed-lectionary
npm run db:seed-hymns
```

Optionally seed sample services, people, and roles for development:

```bash
npm run db:seed
```

### Development

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

### Production build

```bash
npm run build
npm run preview    # preview locally
```

The Node.js adapter produces a standalone server in `build/`.

## Project structure

```
chapel-planner/
├── src/
│   ├── routes/                    # SvelteKit pages and API endpoints
│   │   ├── +page.svelte           # Dashboard (upcoming services, counts)
│   │   ├── services/              # Service list, detail, and creation
│   │   ├── blocks/                # Service block management
│   │   ├── people/                # People directory
│   │   ├── calendar/              # Monthly calendar view
│   │   ├── lectionary/            # Daily lectionary lookup (CW + BCP)
│   │   └── api/                   # REST API (services, blocks, people,
│   │                              #   lectionary, export)
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── schema.ts      # Drizzle table definitions (11 tables)
│   │   │   │   ├── relations.ts   # Drizzle relation declarations
│   │   │   │   └── index.ts       # Database initialisation (WAL mode)
│   │   │   └── services/          # Business logic (CRUD for each entity)
│   │   │       ├── services.ts    # Service CRUD and queries
│   │   │       ├── people.ts      # People search and CRUD
│   │   │       ├── blocks.ts      # Service block CRUD
│   │   │       ├── roles.ts       # Role assignment and invitation tracking
│   │   │       ├── readings.ts    # Service reading overrides
│   │   │       ├── lectionary.ts  # Lectionary queries (by date, context,
│   │   │       │                  #   tradition, year cycle)
│   │   │       ├── hospitality.ts # Hospitality booking CRUD
│   │   │       ├── hymns.ts       # Hymn search and CRUD
│   │   │       └── music.ts       # Service music CRUD
│   │   ├── types/
│   │   │   └── enums.ts           # Rite, ServiceType, Role, Season,
│   │   │                          #   Colour, ReadingType, etc.
│   │   └── utils/
│   │       ├── liturgical-date.ts # Easter computus, season calculation,
│   │       │                      #   liturgical year (A/B/C), office
│   │       │                      #   cycle (1/2)
│   │       ├── format.ts          # Name, date, and time formatting
│   │       └── export.ts          # Service data export for Typst
│   ├── hooks.server.ts            # Auth placeholder (expects LDAP later)
│   └── app.d.ts                   # Global type definitions
├── scripts/
│   ├── seed-lectionary.ts         # Seeds occasions, readings, and
│   │                              #   date map (multi-year)
│   ├── seed-hymns.ts              # Seeds NEH hymnal
│   ├── seed-sample-data.ts        # Seeds example services/people/roles
│   ├── parse-almanac.ts           # Parses oremus almanac HTML → CW
│   │                              #   readings JSON
│   ├── parse-bcp-office.ts        # Parses 1922 Revised Table CSV →
│   │                              #   BCP office readings JSON
│   └── data/                      # Source and generated data files
│       ├── lectionary-occasions.json
│       ├── lectionary-readings-cw-principal.json
│       ├── lectionary-readings-cw-office.json
│       ├── lectionary-readings-cw-eucharist.json
│       ├── lectionary-readings-bcp-hc.json
│       ├── lectionary-readings-bcp-office.json
│       ├── hymns-neh.json
│       ├── 1922-time.csv          # 1922 Revised Table of Lessons
│       ├── 1922-saints.csv        #   (Proper of Time and Saints)
│       └── almanac-*.html         # Oremus almanac source HTML
├── drizzle/                       # Generated migration files
├── data/                          # SQLite database (gitignored)
├── docker/                        # Docker configuration
└── package.json
```

## Database schema

The database has 11 tables across four domains:

### Services

- **`services`** — individual chapel services with date, time, rite (CW/BCP), location, liturgical metadata, and ceremony flags (baptism, confirmation, wedding, blessing)
- **`service_blocks`** — groups of services forming a term or sermon series
- **`service_roles`** — role assignments (preacher, officiant, celebrant, reader, etc.) with invitation status tracking (possibility, requested, declined, accepted)
- **`hospitality`** — accommodation, meals, parking, and expenses for participants linked to service roles

### Lectionary

- **`lectionary_occasions`** — liturgical occasions (e.g. 'Advent Sunday', 'Easter Day', 'Proper 12 — Wednesday') with season, colour, fixed/moveable date info, and collect texts
- **`lectionary_readings`** — scripture readings keyed to occasion, tradition (CW/BCP), service context (principal, morning prayer, evening prayer, etc.), and year cycle
- **`lectionary_date_map`** — maps civil calendar dates to occasions for a range of years, with `isPrincipal` flag to support multiple occasions on one date (e.g. Lent 4 and Mothering Sunday)

### Service readings and music

- **`service_readings`** — readings assigned to a specific service, optionally overriding the lectionary
- **`hymns`** — hymnal entries (title, tune, author, metre, hymnal name and number)
- **`service_music`** — music items linked to services by type and position in the liturgy

### People

- **`people`** — clergy and participants with contact details, institution, college membership, dietary needs

## Lectionary data

The lectionary integration covers both the Common Worship and Book of Common Prayer traditions.

### Common Worship

- **Principal service** — Revised Common Lectionary (3-year cycle A/B/C) with Old Testament, Psalm, Epistle, and Gospel for every Sunday and principal holy day
- **Daily office** — Morning Prayer and Evening Prayer readings (2-year cycle) for every day of the liturgical year
- **Daily eucharist** — weekday eucharistic readings (2-year cycle)
- **Second and third services** — alternative Sunday readings

Source: parsed from [oremus](https://www.oremus.org/) almanac HTML files using `scripts/parse-almanac.ts`.

### Book of Common Prayer

- **Holy Communion** — proper collects and readings for Sundays and holy days, parsed from the oremus almanac
- **Daily office** — Morning Prayer and Evening Prayer readings from the 1922 Revised Table of Lessons, parsed from CSV data using `scripts/parse-bcp-office.ts`

The 1922 Revised Table CSV data is sourced from [inthefourthnocturn.de](https://inthefourthnocturn.de/).

### Seeding

The seed script (`scripts/seed-lectionary.ts`) computes the full liturgical calendar for a range of years using the Easter computus (Meeus/Jones/Butcher algorithm), creates date-to-occasion mappings, and inserts all readings. It handles moveable feasts (Easter, Ascension, Pentecost, Trinity, etc.), fixed feasts (Christmas, Epiphany, saints' days), and the variable-length seasons between Epiphany and Lent and between Trinity and Advent.

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | TypeScript and Svelte type checking |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:push` | Push schema directly to database |
| `npm run db:studio` | Open Drizzle Studio (visual database editor) |
| `npm run db:seed` | Seed sample services, people, and roles |
| `npm run db:seed-lectionary` | Seed lectionary occasions and readings |
| `npm run db:seed-hymns` | Seed NEH hymnal data |

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/services` | List services (filters: `from`, `to`, `blockId`, `serviceType`) |
| POST | `/api/services` | Create service |
| GET | `/api/services/[id]` | Service detail with roles, readings, music |
| PUT | `/api/services/[id]` | Update service |
| DELETE | `/api/services/[id]` | Delete service |
| GET | `/api/blocks` | List service blocks |
| GET | `/api/blocks/[id]` | Block detail with services |
| GET | `/api/people` | List people (filters: `search`, `collegeMembersOnly`) |
| GET | `/api/lectionary/date/[date]` | Readings for a date (`tradition` param) |
| GET | `/api/export/services` | Export services as JSON (for Typst) |
| GET | `/api/export/term-card` | Export term card data (for Typst) |

## Authentication

Currently uses a placeholder that sets a hardcoded local user on every request. This is intended to be replaced with LDAP or similar institutional authentication.

## Licence

Private.
