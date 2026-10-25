# Appview

## Import existing records

Jetstream only provides events from its retention window. Before starting the
appview for the first time, backfill records from each relevant repository's
PDS with `listRecords`:

```sh
cd appview
pnpm ingest:backfill did:plc:... did:web:...
```

The command scans the app's event, checkpoint, team, submission, approval, and
rejection collections, validates and indexes records using the normal indexer,
and applies pending database migrations. Run it with the same `DB_FILE_NAME`
as the appview service. Stop the appview service while backfilling to avoid
overlap with Jetstream updates. It upserts existing records; after
backfilling, start the appview normally so Jetstream can keep the index
current, including subsequent updates and deletes.

Pass every repository DID that may own these records. This command scans the
current contents of those repositories; it does not discover repository DIDs
or remove local records that have since been deleted.
