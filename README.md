# @jambonz/stats-collector

Utility class for sending metrics.  Currently supports Telegraf or Datadog as metrics collector.

## usage
The following environment variables are used:

- `ENABLE_METRICS` set to a value of 1 to enable sending metrics; this package will do nothing if this env var is not set
- `STATS_HOST` ip address or dns name to send stats to (presumably either the Telegraf or Datadog collector is listening there)
- `STATS_PORT` port to send stats to
- `STATS_PROTOCOL` - optional, protocol to use when sending stats; defaults to udp
- `STATS_CACHE_DNS` - optional, whether to cache dns results; defaults to false
- `STATS_TELEGRAF` - set to 1 if sending to Telegraf; otherwise when sending to Datadog
```
const StatsCollector = require('@jambonz/stats-collector');
const stats = new StatsCollector(logger); // optionally, pass a pino logger
stats.gauge('sbc.calls.count', 10);
stats.increment('mycounter');
stats.decrement('mycounter');
```

## Telegraf configuration
When sending stats to Telegraf, your /etc/telegraf.conf configuration file should set `datadog_extensions = true` as shown below.

```
[[inputs.statsd]]
  protocol = "udp"
  max_tcp_connections = 250
  tcp_keep_alive = false
  # tcp_keep_alive_period = "2h"
  service_address = ":8125"
  delete_gauges = true
  delete_counters = true
  delete_sets = true
  delete_timings = true
  ## Percentiles to calculate for timing & histogram stats.
  percentiles = [50.0, 90.0, 99.0, 99.9, 99.95, 100.0]
  metric_separator = "_"
  datadog_extensions = true
  allowed_pending_messages = 10000
  percentile_limit = 1000
  # read_buffer_size = 65535
```