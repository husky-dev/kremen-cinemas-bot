// Dates

const minuteMs = 1000 * 60;
const hourMs = minuteMs * 60;
const dayMs = hourMs * 24;
const weekMs = dayMs * 7;

// Strings

const pad = (n = '', width = 2, z = '0')  => {
  if(typeof n === 'number'){
    n = n.toString();
  }
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// Exports

module.exports = {
  minuteMs,
  hourMs,
  dayMs,
  weekMs,
  pad,
};