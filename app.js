const Srf = require('drachtio-srf') ;
const Mrf = require('drachtio-fsmrf') ;
const srf = new Srf() ;
const mrf = new Mrf(srf) ;
const config = require('config');
const logger = require('pino')();

srf.connect(config.get('drachtio'))
  .on('connect', (err, hostport) => logger.info(`connected to drachtio listening on ${hostport}`))
  .on('error', (err) => logger.error(err, 'Error connecting to drachtio')) ;

mrf.connect(config.get('freeswitch'), (ms) => {
  logger.info(`connected to media server ${ms.address}`);
  // save the media server object as in app locals so it can be retrieved from middleware
  srf.locals.ms = ms ;
}) ;

srf.invite((req, res) => {
  const ms = req.app.locals.ms;

  if (!ms) return res.send(500);

  // connect caller to an endpoint on the media server
  ms.connectCaller(req, res, {
    codecs: ['PCMU']
  }, (err, ep, dlg) => {
    if (err) throw err ;

    // release endpoint when caller hangs up
    dlg.on('destroy', () => ep.destroy()) ;

    // play some prompts
    ep.play(['ivr/8000/ivr-please_reenter_your_pin.wav',
      'ivr/8000/ivr-please_state_your_name_and_reason_for_calling.wav',
      'ivr/8000/ivr-you_lose.wav'], (err, results) => {
      logger.info(results, 'completed playing prompts') ;
    }) ;
  }) ;
}) ;
