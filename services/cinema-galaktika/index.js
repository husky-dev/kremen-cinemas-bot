// Consts
const { name, version, description } = require('./package.json');
const { errors } = require('./common/consts.js');
// Libs
const { getSchedule } = require('./lib/parser.js');
// Common
const { asyncWrap } = require('./common/async.js');
const log = require('./common/log.js').withModule('app');
// Consts
const title = 'Кінотеатр "Галактика"';
const website = 'http://galaktika-kino.com.ua/';
const contacts = [
  {mobile: '(067) 534-4-534'},
];

// App
const app = require('express')();
// Adding custom responses
require('./common/responses.js')(app, name);

// Info
log.info('v' + version);
log.info(description);

// Root
app.get('/', asyncWrap(async (req,res) => {
  const schedule = await getSchedule();
  res.result({title, website, contacts, schedule});
}));

app.get('/schedule', asyncWrap(async (req,res) => {
  res.result(await getSchedule());
}));

// Default response
app.all('/*', (req,res) => {
  res.err({name: errors.UNKNOW_API_ENDPOINT, descr: {url: req.url, method: req.method}});
});

// Run
const appPort = process.env.PORT || 8080;
app.listen(appPort, () => {
	log.info('listening on port: ' + appPort);
});
