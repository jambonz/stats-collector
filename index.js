const StatsD = require('hot-shots');
const assert = require('assert');
const Emitter = require('events');
const debug = require('debug')('jambonz:stats-collector');
function onError(logger, err) {
  logger.info(err, 'Error sending metrics');
}

class StatsCollector extends Emitter {
  constructor(logger) {
    super();
    this.logger = logger;

    if (process.env.ENABLE_METRICS && 1 === parseInt(process.env.ENABLE_METRICS)) {
      const opts = {
        prefix: process.env.STATS_PREFIX || '',
        errorHandler: onError.bind(null, logger),
        host: process.env.STATS_HOST || '127.0.0.1',
        port: process.env.STATS_PORT,
        protocol: process.env.STATS_PROTOCOL || 'udp',
        cacheDns: process.env.STATS_CACHE_DNS === 1,
        telegraf: process.env.STATS_TELEGRAF === 1,
      };

      this.statsd = new StatsD({...opts, errorHandler: this._errorHandler.bind(this, opts)});
      this.logger.info(`sending stats to ${opts.host}`);
    }

    this.on('resourceCount', this._onResourceCount.bind(this));
  }

  _errorHandler(opts, err) {
    if (err.message === 'This socket has been ended by the other party') {
      this.logger.info('StatsCollector:_errorHandler socket closed, reconnecting..');
      this.statsd = new StatsD({...opts, errorHandler: this._errorHandler.bind(this, opts)});
    }
    else this.logger.error({err}, 'StatsCollector:_errorHandler');
  }

  _onResourceCount(evt) {
    debug({evt}, 'got resourceCount event');
    if (!this.statsd) return;
    const name = `${evt.hostType}.${evt.resource}.count`;
    debug(`sending ${name} with value ${evt.count}`);
    this.statsd.gauge(name, evt.count, {hostname: evt.host}, (err, bytes) => {
      if (err) return this.logger.error(err, 'Error sending stats');
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
