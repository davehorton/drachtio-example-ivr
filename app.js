var app = require('drachtio')() ;
var Mrf = require('drachtio-fsmrf') ;
var mrf = new Mrf(app) ;
var Srf = require('drachtio-srf') ;
var srf = new Srf(app) ;

srf.connect({
  host: '127.0.0.1',
  port: 9022,
  secret: 'cymru',
}) 
.on('connect', (err, hostport) => { console.log(`connected to drachtio listening on ${hostport}`) ;})
.on('error', (err) => { console.error(`Error connecting to drachtio at ${err || err.message}`) ; }) ;

mrf.connect( {
  address: '127.0.0.1',
  port: 8021,
  secret: 'ClueCon'
}, (ms) => {
  console.log(`connected to media server `);
  // save the media server object as in app locals so it can be retrieved from middleware
  srf.locals.ms = ms ;
}) ;

srf.invite( (req, res) => {
  
  // connect caller to an endpoint on the media server
  req.app.locals.ms.connectCaller(req, res, {
    codecs: ['PCMU']
  }, (err, ep, dialog) => {
    if( err ) { throw err ; }

    // set up dialog handlers
    dialog.on('destroy', () => { ep.destroy() ; }) ;

    // play some prompts
    ep.play(['ivr/8000/ivr-please_reenter_your_pin.wav',
      'ivr/8000/ivr-please_state_your_name_and_reason_for_calling.wav',
      'ivr/8000/ivr-you_lose.wav'], function(err, results){
        console.log(`results: ${JSON.stringify(results)}`) ;
      }) ;
  }) ; 
}) ;
