const StatsD = require('hot-shots');
const assert = require('assert');
const Emitter = require('events');
const debug = require('debug')('jambonz:stats-collector');
function onError(logger, err) {
  logger.info(err, 'Error sending metrics to datadog');
}

class StatsCollector extends Emitter {
  constructor(logger) {
    super();
    this.logger = logger;

    if (process.env.ENABLE_DATADOG_METRICS && 1 === parseInt(process.env.ENABLE_DATADOG_METRICS)) {
      const prefix = process.env.DATADOG_PREFIX || '';
      this.statsd = new StatsD({prefix, errorHandler: onError.bind(null, logger)});
      this.logger.info('sending stats to Datadog');
    }

    this.on('resourceCount', this._onResourceCount.bind(this));
  }

  _onResourceCount(evt) {
    debug({evt}, 'got resourceCount event');
    if (!this.statsd) return;
    const name = `${evt.hostType}.${evt.resource}.count`;
    debug(`sending ${name} with value ${evt.count} to datadog`);
    this.statsd.gauge(name, evt.count, {hostname: evt.host}, (err, bytes) => {
      if (err) return this.logger.error(err, 'Error sending to datadog');
    });
  }

  _command(verb, ...args) {
    if (!this.statsd) return;
    assert.ok([
      'increment',
      'decrement',
      'histogram',
      'distribution',
      'gauge'
    ].includes(verb, `unknown stats command ${verb}`));
    debug({args, verb}, 'sending statsd metric');
    this.statsd[verb].apply(this.statsd, args);
  }
  increment(name, ...args) { return this._command.apply(this, ['increment', name, ...args]); }
  decrement(name, ...args) { return this._command.apply(this, ['decrement', name, ...args]); }
  histogram(name, ...args) { return this._command.apply(this, ['histogram', name, ...args]); }
  distribution(name, ...args) { return this._command.apply(this, ['distribution', name, ...args]); }
  gauge(name, ...args) { return this._command.apply(this, ['gauge', name, ...args]); }
}

module.exports = StatsCollector;
