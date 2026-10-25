# Shadow mode

Shadow mode fetches live source data and uses the application's normal
message-building logic. It replaces outbound publication calls with structured
console and JSON-lines logs. It does not log in to Discord or publish to any
social network.

## Requirements

- Node.js 20 or 22
- Dependencies installed with `npm ci`
- Network access to the source APIs being inspected
- `.env` values for any source that requires authentication

Social publishing credentials are not needed for shadow output. The optional
`facebook-feed` workflow needs a Facebook token because it reads the page feed.

## Run a one-time preview

From the repository root, run:

```sh
npm run shadow
```

With no target arguments, it runs current warnings, the daily weather report,
and fire events. To run specific workflows:

```sh
npm run shadow -- warnings weather
npm run shadow -- warnings fire-risk fires
npm run shadow -- --help
```

Available targets are `warnings`, `weather`, `fires`, `fire-risk`,
`meteoalarm`, `decrees`, `travel`, and `facebook-feed`.

## Compare first-run behavior

The shadow database remembers which warnings and events were already handled.
To reset only that database and process current records as unseen:

```sh
SHADOW_RESET_DB=true npm run shadow -- warnings weather
```

The database is `data/db.shadow.sqlite`. Normal development and production
database files are separate. Keep the shadow database between runs when you
want to observe only new updates.

## Run the regular schedule

To let the scheduled jobs run continuously while all outbound posts are logged:

```sh
npm run shadow:watch
```

Stop with Ctrl+C. The schedule uses the local machine's clock and the same
`JOB_*` switches as the bot. The VOST Europe scheduled posts remain disabled by
default.

## Read the output

Each planned post is printed to the terminal and appended to
`logs/publications.jsonl`. Choose another path with `PUBLISH_LOG_FILE`:

```sh
PUBLISH_LOG_FILE=logs/weather-preview.jsonl npm run shadow -- weather
```

Each JSON line contains a timestamp, run ID, destination, and payload. The
payload includes the account or Discord channel, the post text, and media URLs
or filenames. Binary buffers and long base64 images are summarized to keep the
log readable.

Example:

```text
[DRY-RUN] Would publish to facebook:
{
  "account": "main",
  "message": "ℹ️⚠️🟠 #AvisoLaranja ...",
  "media": "warnings/Twitter_Post_AvisoLaranja_....png"
}
```

IPMA warning rules determine the expected destinations: yellow warnings do not
go to Facebook; orange and red warnings do. The daily weather report currently
does not have a Facebook publisher. These are expected absences in the preview.

When local Discord channel IDs are missing, the output still shows the planned
message and labels its channel `unconfigured`. This lets you inspect content
without copying production channel IDs to your Mac.

## Compare with production

Run the same workflow in shadow mode and in production, then compare the text,
account, media, and target channel. The log timestamps and `runId` help group
the entries from one run. Shadow mode uses live upstream data, so results can
differ if warnings or feeds change between runs. Resetting the shadow database
causes current active items to be treated as new again.
