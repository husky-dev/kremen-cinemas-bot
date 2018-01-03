// Require
const _ = require('lodash');
const iconv = require('iconv-lite');
const cheerio = require('cheerio');
const {requestPromisse} = require('../common/async');
const {erros} = require('../common/consts');
const log = require('../common/log.js').withModule('parser');

// Consts
const SCHEDULE_URL = 'http://galaktika-kino.com.ua/main/price.php';

// Schedule

const getSchedule = async () => {
  const html = await getHtml(SCHEDULE_URL);
  const $ = cheerio.load(html, { decodeEntities: false });
  const content = $('#opis');
  // Periods
  let periods = [{halls: []}];
  content.children().each((index, el) => {
    if(el.name === 'p'){
      // If it text element - it's can be period info
      const period = parsePeriodFromStr($(el).text());
      if(period){
        if(!periods[0].start){
          // If it's first period - just update it
          periods[0] = {...period, ...periods[0]};
        }else{
          // Else - create new one
          periods.push({...period, halls: []});
        }
      }
    }
    if(el.name === 'table'){
      // If it's table - it's hall data
      const hallData = parseHallTable($, el);
      const periodData = _.last(periods);
      periodData.halls.push(hallData);
    }
  });
  return periods;
}

const parsePeriodFromStr = (str = '') => {
  if(!str) return null;
  // Temporary fix (date wrong at the site)
  let modStr = str.replace(/01\.2017/g, '01.2018');
  const periodReg = /(\d+\.\d+\.\d+).+?(\d+\.\d+\.\d+)/g;
  const periodMatch = periodReg.exec(modStr);
  if(!periodMatch) return null;
  else return {start: periodMatch[1], end: periodMatch[2]};
}

const parseHallTable = ($, table) => {
  const info = parseHallInfo($, table);
  const sessions = parseHallSessions($, table);
  return {...info, sessions};
}

const parseHallInfo = ($, table) => {
  let data = {name: null, places: null};
  // Name
  data.name = $('tr:first-child td:first-child strong', table).text().trim() || null;
  // Places
  const tdHtml = $('tr:first-child td:first-child', table).html();
  const placesReg = /имеет (\d+)/g;
  const placesMatch = placesReg.exec(tdHtml);
  if(placesMatch){
    data.places = parseInt(placesMatch[1]);
  }

  return data;
}

const parseHallSessions = ($, table) => {
  let sessions = [];
  $('tr', table).each((index, row) => {
    // Passing first fields
    if(index <= 1) return;
    const data = parseHallSessionTableRow($, row);
    if(!data.title) return;
    sessions.push(data);
  });
  return sessions;
}

const parseHallSessionTableRow = ($, row) => {
  let data = {};
  $('td', row).each((index, el) => {
    if(index === 0){
      const {title, format} = parseMovieTitle($(el).text().trim());
      data.title = clearMovieTitle(title);
      data.format = format;
    } 
    if(index === 1){
      data.time = parseMovieTime($(el).text().trim());
    }
    if(index === 2){
      data.price = parseMoviePrice($(el).text().trim());
    }
  });
  return data;
}

const parseMovieTitle = (title = '') => {
  if(!title) return {title: null, format: null};
  // Usual
  const usualReg = /"([\s\S]+?)"\s+([\d]D)/g;
  const usualMatch = usualReg.exec(title);
  if(usualMatch){
    return {title: usualMatch[1], format: usualMatch[2]}
  }
  // Without starting
  const withoutStartReg = /([\s\S]+?)"\s+([\d]D)/g;
  const withoutStartMatch = withoutStartReg.exec(title);
  if(withoutStartMatch){
    return {title: withoutStartMatch[1], format: withoutStartMatch[2]}
  }
  // Without format
  const withoutFormatReg = /"([\s\S]+?)"/g;
  const withoutFormatMatch = withoutFormatReg.exec(title);
  if(withoutFormatMatch){
    return {title: withoutFormatMatch[1], format: null}
  }
  // Default response
  return {title, format: null};
}

const clearMovieTitle = (title = '') => {
  if(!title) return '';
  return title;
}

const parseMovieTime = (time = '') => {
  if(!time) return null;
  return time;
}

const parseMoviePrice = (price = '') => {
  if(!price) return null;
  const regex = /\d+/g;
  const match = regex.exec(price);
  if(match){
    return parseInt(match[0]);
  }else{
    log.warn(`unnable to parse price "${price}"`);
    return price;
  }
}

// Html

const  getHtml = async (url) => {
	const reqOpt = {url, encoding: null};
	let {body} = await requestPromisse(reqOpt);
	// Converting
  const encodingFromBody = getEncodingFromHtml(body.toString());
	if(encodingFromBody){
		try{
			body = iconv.decode(body, encodingFromBody);
		}catch(e){
			throw {name: errors.ENCODING_CONVERSION_ERR, descr: url};
		}
	}
	// Return body
	return _.isBuffer(body) ? body.toString() : body;
}

const getEncodingFromHtml = (body) => {
	const encodingReg = /<meta charset="([\w-]+)"[\/\s]+?>/g;
	const match = encodingReg.exec(body);
	if(!match) return null;
	const encodingStr = match[1].toLowerCase().trim();
	if(encodingStr === 'windows-1251') return 'cp1251';
	return encodingStr;
}

// Exports
module.exports = {
  getSchedule,
}
