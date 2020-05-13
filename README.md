# jambonz-stats-collector

Utility class for sending metrics.  Currently supports only Datadog as metrics collector.

## usage
The following environment variables are used:

- `ENABLE_DATADOG_METRICS` set to a value of 1 to enable sending metrics to Datadog; this package will do nothing if this env var is not set
- `DATADOG_PREFIX` optional prefix to apply to Datadog stats
```
const StatsCollector = require('jambonz-stats-collector');
const stats = new StatsCollector(logger); // optionally, pass a pino logger
stats.gauge('sbc.calls.count', 10);
stats.increment('mycounter');
stats.decrement('mycounter');
```