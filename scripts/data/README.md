# Data Scripts

Scripts for seeding demo data and creating test data.

## Scripts

- `seed-demo-data.ts` - Seed comprehensive demo data
- `create-test-alert.ts` - Create test alerts for healthcare
- `create-test-healthcare-data.ts` - Create healthcare test data
- `test-analytics-data.ts` - Generate analytics test data

## Usage

```bash
# Seed demo data
tsx scripts/data/seed-demo-data.ts

# Create test alerts
tsx scripts/data/create-test-alert.ts

# Create healthcare test data
tsx scripts/data/create-test-healthcare-data.ts

# Generate analytics data
tsx scripts/data/test-analytics-data.ts
```

## Data Categories

1. **Demo Data** - Realistic data for demonstrations
2. **Test Alerts** - Healthcare alert scenarios
3. **Healthcare Data** - Patients, shifts, staff
4. **Analytics Data** - Metrics and statistics

## Best Practices

- Always run in a test environment first
- Use realistic but anonymized data
- Include edge cases in test data
- Document data relationships