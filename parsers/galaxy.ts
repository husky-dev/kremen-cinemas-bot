import cheerio from 'cheerio';
import { ICinema, ICinemaMovie, ICinemaSession, IContact } from 'common/types';
import iconv from 'iconv-lite';
import { isBuffer, last } from 'lodash';
import { asyncReq, Log } from 'utils';
const SCHEDULE_URL = 'http://galaktika-kino.com.ua/main/price.php';
const log = Log('parser');

interface IGalaxySession {
  title?: string;
  format?: string;
  time?: string;
  price?: number;
}

interface IGalaxyHall {
  name: string | null;
  places: number | null;
  sessions: IGalaxySession[];
}

interface IGalaxyPeriod {
  start: string | null;
  end: string | null;
  halls: IGalaxyHall[];
}

interface IParsedMoveTitle {
  title: string | null;
  format: string | null;
}

interface IParsedHallInfo {
  name: string | null;
  places: number | null;
}

interface IParsedPeriod {
  start: string;
  end: string;
}

// Cinema

export const getCinema = async (): Promise<ICinema> => {
  const title = 'Галактика';
  const website = "http://galaktika-kino.com.ua/";
  const contacts: IContact[] = [
    { mobile: "+38 (067) 534-4-534" },
  ];
  const schedule = await getSchedule();
  const movies = scheduleToMovies(schedule);
  return { title, website, contacts, movies };
};

const scheduleToMovies = (schedule: IGalaxyPeriod[]): ICinemaMovie[] => {
  const res: ICinemaMovie[] = [];
  for (const period of schedule) {
    const { halls } = period;
    for (const hall of halls) {
      const { sessions, name: hallName } = hall;
      for (const session of sessions) {
        const { title, format = '2d', time = '00:00', price = 0 } = session;
        if (title) {
          const sessionData: ICinemaSession = {
            format, time, price, hall: hallName,
          };
          const exMovie = res.find((item) => item.title === title);
          if (exMovie) {
            exMovie.sessions.push(sessionData);
          } else {
            res.push({ title, sessions: [ sessionData ] });
          }
        }
      }
    }
  }
  return res;
};

// Schedule

const getSchedule = async (): Promise<IGalaxyPeriod[]> => {
  const html = await getHtml(SCHEDULE_URL);
  const $ = cheerio.load(html, { decodeEntities: false });
  const content = $('#opis');
  // Periods
  const periods: IGalaxyPeriod[] = [{start: null, end: null, halls: []}];
  content.children().each((_index, el) => {
    if (el.name === 'p') {
      // If it text element - it's can be period info
      const period = parsePeriodFromStr($(el).text());
      if (period) {
        if (!periods[0].start) {
          // If it's first period - just update it
          periods[0] = {...periods[0], ...period};
        } else {
          // Else - create new one
          periods.push({...period, halls: []});
        }
      }
    }
    if (el.name === 'table') {
      // If it's table - it's hall data
      const hallData = parseHallTable($, el);
      const periodData = last(periods);
      if (periodData) {
        periodData.halls.push(hallData);
      }
    }
  });
  return periods;
};

const parsePeriodFromStr = (str: string): IParsedPeriod | null => {
  if (!str) { return null; }
  const periodReg = /(\d+\.\d+\.\d+).+?(\d+\.\d+\.\d+)/g;
  const periodMatch = periodReg.exec(str);
  if (!periodMatch) {
    return null;
  } else { return { start: periodMatch[1], end: periodMatch[2] }; }
};

const parseHallTable = ($: CheerioStatic, table: CheerioElement): IGalaxyHall => {
  const info = parseHallInfo($, table);
  const sessions = parseHallSessions($, table);
  return { ...info, sessions };
};

const parseHallInfo = ($: CheerioStatic, table: CheerioElement): IParsedHallInfo => {
  const data: IParsedHallInfo = {
    name: null, places: null,
  };
  // Name
  data.name = $('tr:first-child td:first-child strong', table).text().trim() || null;
  // Places
  const tdHtml = $('tr:first-child td:first-child', table).html();
  if (tdHtml) {
    const placesReg = /имеет (\d+)/g;
    const placesMatch = placesReg.exec(tdHtml);
    if (placesMatch) {
      data.places = parseInt(placesMatch[1], 10);
    }
  }
  return data;
};

const parseHallSessions = ($: CheerioStatic, table: CheerioElement): IGalaxySession[] => {
  const sessions: IGalaxySession[] = [];
  $('tr', table).each((index, row) => {
    // Passing first fields
    if (index <= 1) { return; }
    const data = parseHallSessionTableRow($, row);
    if (!data.title) { return; }
    sessions.push(data);
  });
  return sessions;
};

const parseHallSessionTableRow = ($: CheerioStatic, row: CheerioElement): IGalaxySession => {
  const data: IGalaxySession = {};
  $('td', row).each((index, el) => {
    if (index === 0) {
      const { title, format } = parseMovieTitle($(el).text().trim());
      if (title) {
        data.title = clearMovieTitle(title);
      }
      data.format = format;
    }
    if (index === 1) {
      data.time = parseMovieTime($(el).text().trim());
    }
    if (index === 2) {
      data.price = parseMoviePrice($(el).text().trim());
    }
  });
  return data;
};

const parseMovieTitle = (title: string = ''): IParsedMoveTitle => {
  if (!title) {
    return { title: null, format: null };
  }
  // Usual
  const usualMatch = /"([\s\S]+?)"\s+([\d]D)/g.exec(title);
  if (usualMatch) {
    return { title: usualMatch[1], format: usualMatch[2] };
  }
  // Without starting
  const withoutStartMatch = /([\s\S]+?)"\s+([\d]D)/g.exec(title);
  if (withoutStartMatch) {
    return {title: withoutStartMatch[1], format: withoutStartMatch[2]};
  }
  // Without format
  const withoutFormatMatch = /"([\s\S]+?)"/g.exec(title);
  if (withoutFormatMatch) {
    return {title: withoutFormatMatch[1], format: null};
  }
  // Default response
  return { title, format: null };
};

const clearMovieTitle = (title: string = ''): string => {
  if (!title) {
    return '';
  } else {
    return title;
  }
};

const parseMovieTime = (time: string = ''): string | null => {
  if (!time) {
    return null;
  } else {
    return time;
  }
};

const parseMoviePrice = (price: string = ''): number | null => {
  if (!price) { return null; }
  const regex = /\d+/g;
  const match = regex.exec(price);
  if (match) {
    return parseInt(match[0], 10);
  } else {
    log.warn(`unnable to parse price "${price}"`);
    return null;
  }
};

const  getHtml = async (url: string): Promise<string> => {
  const reqOpt = { url, encoding: null };
  let { body } = await asyncReq(reqOpt);
  // Converting
  const encodingFromBody = getEncodingFromHtml(body.toString());
  if (encodingFromBody) {
    try {
      body = iconv.decode(body, encodingFromBody);
    } catch (e) {
      throw { name: 'ENCODING_CONVERSION_ERR', descr: url };
    }
  }
  // Return body
  return isBuffer(body) ? body.toString() : body;
};

const getEncodingFromHtml = (body: string): string | null => {
  const encodingReg = /<meta charset="([\w-]+)"[\/\s]+?>/g;
  const match = encodingReg.exec(body);
  if (!match) {
    return null;
  }
  const encodingStr = match[1].toLowerCase().trim();
  if (encodingStr === 'windows-1251') { return 'cp1251'; }
  return encodingStr;
};
