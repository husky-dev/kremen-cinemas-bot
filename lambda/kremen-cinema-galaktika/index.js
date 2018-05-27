'use strict'

process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

const { getSchedule } = require('./lib/parser.js');

const title = 'Кінотеатр "Галактика"';
const website = 'http://galaktika-kino.com.ua/';
const contacts = [
  { mobile: '+38 (067) 534-4-534' },
];

exports.handler = async (event, context) => {
  const schedule = await getSchedule();
  const data = { title, website, contacts, schedule };
  return data;
};
