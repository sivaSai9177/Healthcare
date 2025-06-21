#!/bin/bash
set -e

# Create multiple databases for different environments
for db in myexpo_dev myexpo_preview myexpo_test; do
  echo "Creating database: $db"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE $db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL
done

echo "All databases created successfully!"