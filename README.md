# FinanceManager

## Mutual Fund Management Features

- Add or update mutual fund entries using `/add-mutual-fund` (POST)
  - Required fields: `fundID`, `monthlySip`, `sipStartDate`, `sipDeductionDate`
  - Fetches latest NAV and scheme name from mfapi.in automatically
  - Calculates units and current amount
  - Upserts (inserts or updates) the mutual fund document in the database

- Get all mutual funds using `/all-mutual-fund/` (GET)
- Get a mutual fund by name using `/select-mutual-fund/:name` (GET)
- Get a summary of the mutual fund portfolio using `/get-summary` (GET)

## Target Management Features

- Set daily, weekly, monthly, quarterly, and yearly targets using `/create-target` (POST)
- Retrieve all targets using `/all-targets` (GET)
- Compare actual analytics data to targets for a given period using `/target-comparison?period=...` (GET)
  - Supported periods: `daily`, `weekly`, `monthly`, `quarterly`, `yearly`
  - Returns target, actual, and difference for each period

## Cron Jobs

- `mfCrone.ts`: Monthly SIP execution for all funds, updates units, NAV, and investment values
- `updateNavCron.ts`: Daily NAV update for all funds

## Models

- `mutualFundModel.ts`: Defines the schema for mutual funds, including SIP, NAV, units, and investment tracking
- `analyticsAggeragteModel.ts`: Defines the schema for analytics aggregation (daily, weekly, etc.)
- `targetModel.ts`: Defines the schema for financial targets (daily, weekly, etc.)

## API Endpoints

| Endpoint                                 | Method | Description                                                        |
|------------------------------------------|--------|--------------------------------------------------------------------|
| `/add-mutual-fund`                       | POST   | Add or update a mutual fund                                        |
| `/all-mutual-fund/`                      | GET    | Get all mutual funds                                               |
| `/select-mutual-fund/:name`              | GET    | Get a mutual fund by name                                          |
| `/get-summary`                           | GET    | Get portfolio summary (current/invested/margin)                    |
| `/create-target`                         | POST   | Set daily, weekly, monthly, quarterly, and yearly targets          |
| `/all-targets`                           | GET    | Get all target entries                                             |
| `/target-comparison?period=...`          | GET    | Compare analytics to targets for a given period (default: daily)   |

## Notes
- All mutual fund operations are handled in `src/controllers/mfController.ts`.
- Target management and analytics comparison logic is in `src/controllers/targetController.ts`.
- Cron jobs for SIP and NAV update are in `src/crone/`.
- Models are in `src/models/`.
- See `src/routes/routes.ts` for all available endpoints.

---

For more details, see the code comments in each file.
