# Kremen Cinema

## Init

Create `config.dev.json` and `config.prod.json` with configs:

```json
{
  "BOT_TOKEN": "%token%",
  "CACHE_ENABLED": false,
  "REDIS_HOST": "%host%",
  "REDIS_PORT": 5555,
  "REDIS_PASS": "%pass%",
  "ADMIN_TOKEN": "%token%"
}

```

Where:

- `BOT_TOKEN` - telegram's bot token
- `CACHE_ENABLED` - enable/dissable redis cache
- `REDIS_HOST / REDIS_PORT / REDIS_PASS` - redis credentials
- `ADMIN_TOKEN` - randomly generated string for auth in system

## TODO

- Check new movies and auto send
- Call lamda directly
- Log level
