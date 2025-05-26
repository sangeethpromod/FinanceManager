# FinanceManager

## API Endpoints

| Endpoint                                 | Method | Description                                                        |
|------------------------------------------|--------|--------------------------------------------------------------------|
| `/new-transaction`                       | POST   | Create a new transaction                                           |
| `/all-transactions`                      | GET    | Get all transactions                                               |
| `/import-transaction`                    | POST   | Import transactions using Gemini agent                             |
| `/mf-analyze`                            | GET    | Get mutual fund investment advice (agent)                          |
| `/create-account`                        | POST   | Create a new account                                               |
| `/aggregate/daily`                       | POST   | Aggregate analytics daily                                          |
| `/aggregate/weekly`                      | POST   | Aggregate analytics weekly                                         |
| `/aggregate/monthly`                     | POST   | Aggregate analytics monthly                                        |
| `/aggregate/quarterly`                   | POST   | Aggregate analytics quarterly                                      |
| `/aggregate/yearly`                      | POST   | Aggregate analytics yearly                                         |
| `/add-mutual-fund`                       | POST   | Add or update a mutual fund                                        |
| `/all-mutual-fund/`                      | GET    | Get all mutual funds                                               |
| `/select-mutual-fund/:name`              | GET    | Get a mutual fund by name                                          |
| `/funds/lumpsum`                         | POST   | Add a lumpsum investment to a fund                                 |
| `/funds/sip-status`                      | PUT    | Update SIP status for a fund                                       |
| `/get-summary`                           | GET    | Get portfolio summary (current/invested/margin)                    |
| `/create-target`                         | POST   | Set daily, weekly, monthly, quarterly, and yearly targets          |
| `/getall-target`                         | GET    | Get all target entries                                             |
| `/current-period-status`                 | GET    | Get current period target status                                   |
| `/target-comparison`                     | GET    | Compare analytics to targets for a given period                    |
| `/create-category`                       | POST   | Create a new category                                              |
| `/getall-category`                       | GET    | Get all categories                                                 |
| `/create-party-map`                      | POST   | Create a party-category mapping                                    |
| `/party-map-unmapped`                    | GET    | Get unmapped parties                                               |
| `/update-party-map/:id`                  | PUT    | Update a party-category mapping                                    |
| `/get-allparty-map`                      | GET    | List all party-category mappings                                   |

## Mutual Fund Management Features

- Add or update mutual fund entries using `/add-mutual-fund` (POST)
  - Required fields: `fundID`, `monthlySip`, `sipStartDate`, `sipDeductionDate`
  - Fetches latest NAV and scheme name from mfapi.in automatically
  - Calculates units and current amount
  - Upserts (inserts or updates) the mutual fund document in the database
- Get all mutual funds using `/all-mutual-fund/` (GET)
- Get a mutual fund by name using `/select-mutual-fund/:name` (GET)
- Add lumpsum investment using `/funds/lumpsum` (POST)
- Update SIP status using `/funds/sip-status` (PUT)
- Get a summary of the mutual fund portfolio using `/get-summary` (GET)

## Target Management Features

- Set daily, weekly, monthly, quarterly, and yearly targets using `/create-target` (POST)
- Retrieve all targets using `/getall-target` (GET)
- Compare actual analytics data to targets for a given period using `/target-comparison` (GET)
  - Supported periods: `daily`, `weekly`, `monthly`, `quarterly`, `yearly`
  - Returns target, actual, and difference for each period
- Get current period status using `/current-period-status` (GET)

## Analytics & Aggregation

- Aggregate analytics data daily, weekly, monthly, quarterly, and yearly using the `/aggregate/*` endpoints (POST)
- Aggregation is triggered via API, not on a schedule by default

## Category & Party Mapping

- Create and manage categories and party-category mappings
- Endpoints: `/create-category`, `/getall-category`, `/create-party-map`, `/party-map-unmapped`, `/update-party-map/:id`, `/get-allparty-map`

## Transaction Management

- Create and fetch transactions using `/new-transaction` (POST) and `/all-transactions` (GET)
- Import transactions using `/import-transaction` (POST)

## Cron Jobs

- `mfCrone.ts`: Monthly SIP execution for all funds, updates units, NAV, and investment values
- `updateNavCron.ts`: Daily NAV update for all funds
- Aggregation endpoints can be scheduled externally if needed

## Models

- `mutualFundModel.ts`: Defines the schema for mutual funds, including SIP, NAV, units, and investment tracking
- `analyticsAggeragteModel.ts`: Defines the schema for analytics aggregation (daily, weekly, etc.)
- `targetModel.ts`: Defines the schema for financial targets (daily, weekly, etc.)
- `financeModel.ts`, `categoryModel.ts`, `partyCategoryMap.ts`, etc.

## Notes
- All mutual fund operations are handled in `src/controllers/mfController.ts`.
- Target management and analytics comparison logic is in `src/controllers/targetController.ts`.
- Cron jobs for SIP and NAV update are in `src/crone/`.
- Models are in `src/models/`.
- See `src/routes/routes.ts` for all available endpoints and details.

---

For more details, see the code comments in each file.
