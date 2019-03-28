const { QueueStream } = require('./Queuestream');
const { Track } = require('./Track');
const { shuffleArray } = require('../utils/shuffle');
const { calculateScheduled, getHHMMSS } = require('../utils/time');
const { createHandler } = require('../utils/handlers');
const { logger } = require('../utils/logger');
const { noop } = require('../utils/funcs');

// TODO add icy metaint
const headers = {
  'icy-name': '@kefir100/radio-engine',
  'icy-genre': 'house',
  'icy-url': 'https://',
  'icy-pub':'0',
  'icy-br':'56',
  'icy-metaint': '0',
  'icy-notice1': 'Live radio powered by https://www.npmjs.com/package/@kefir100/radio-engine',
  'Cache-Control': 'no-cache,no-store,must-revalidate,max-age=0',
  'Content-Type': 'audio/mpeg',
};

class Station {
  constructor(handlers) {
    this.playlist = [];
    this.stats = {
      numPlayed: 0,
      connected: 0,
      connections: 0,
    };

    this.queuestream = new QueueStream({ maxListeners: 100 });
    this.queuestream.on('next', ({ fsStats: { stringified } }) => {
      logger(`Playing: ${stringified}`, 'g');
      this.stats.numPlayed++;
    });
    this.queuestream.on('end', () => {
      this.start({ shuffle: true });
    });

    handlers && createHandler(handlers);
  }

  start({ shuffle = false } = {}) {
    if (shuffle) {
      this.playlist = shuffleArray(this.playlist);
    }
    logger('Playlist  schedule : trackname [size/duration]', 'r', false);
    this.playlist.forEach(({ track }, i) => {
      const scheduled = getHHMMSS(calculateScheduled({ playlist: this.playlist }, i));
      logger(` ${scheduled} : ${track.fsStats.stringified}`);

      this.queuestream.queue(track);
    });
    this.queuestream.next();
  }

  connectListener(req, res, cb = noop) {
    const { current, getPrebuffer } = this.queuestream;
    current.on('error', e => {
      logger(e, 'r');
    });

    this.stats.connected++;
    this.stats.connections++;

    res.writeHead(200, headers);
    req.connection.on('close', () => {
      this.stats.connected--;
    });

    res.write(getPrebuffer());
    current.pipe(res);
    cb();
  }

  addTrack({ path, file }) {
    const fullPath = `${path}/${file}`;
    const track = new Track({
      path: fullPath,
      name: file,
    });

    this.playlist.push({ track });
  }
}

module.exports = {
  Station,
};
