var cheerio = require('cheerio');
var request = require('request');
var exec = require('child_process').exec;

var days = {
  'sun': 'Sunday',
  'mon': 'Monday',
  'tue': 'Tuesday',
  'wed': 'Wednesday',
  'thu': 'Thursday',
  'fri': 'Friday',
  'sat': 'Saturday'
};

var locations = {};

locations.chelsea = 'newyork.ucbtheatre.com';
locations.beast = 'east.ucbtheatre.com';
locations.losangeles = 'losangeles.ucbtheatre.com';

var url = '';
var today = new Date();
var currentMonth = today.getMonth()+1 > 9 ? today.getMonth()+1 : '0' + (parseInt(today.getMonth())+1);

for (location in locations) {
  url = buildURL(locations[location]);

  request(url, function(error, response, body) {
    var theater = determineTheater(response.request.host);
    var schedule = getSchedule(cheerio.load(body));
    var payload = encodeURIComponent(JSON.stringify(schedule));

    exec('php ./bin/update.php "' + payload + '" ' + theater + ' >> output.dat');
  });
}

// // BEAST schedule
// url = locations.beast + '/' + today.getFullYear() + '/' + currentMonth;

// request(url, function(error, response, body) {
//   var $ = cheerio.load(body);
//   var schedule = getSchedule($);
//   var payload = encodeURIComponent(JSON.stringify(schedule));

//   exec('php ./bin/update.php "' + payload + '" beast >> output.dat');
// });

// // Los Angeles schedule
// url = locations.losangeles + '/' + today.getFullYear() + '/' + currentMonth;

// request(url, function(error, response, body) {
//   var $ = cheerio.load(body);
//   var schedule = getSchedule($);
//   var payload = encodeURIComponent(JSON.stringify(schedule));

//   exec('php ./bin/update.php "' + payload + '" losangeles >> output.dat');
// });

String.prototype.cleanText = function () {
  return this.split('\n').join('').trim();
};

function log(info) {
  exec('echo "' + info + '" >> output.dat');
}

function getSchedule($) {

  var schedule = [];
  var $weeks = $('table.schedule tr.weeklabels');

  $weeks.each(function() {
    var $self = $(this);
    var $schedule = $self.next();
    var date = null;
    var date_string = '';
    var dayClass = '';
    var month;
    var day;

    for (day in days) {
      dayClass = '.' + day;
      date = $self.find(dayClass).text().replace(days[day], '');

      if (!date.length) {
        continue;
      }

      // Create a date object from the show's date string.
      date = new Date(date + ', ' + new Date().getFullYear());

      month = parseInt(date.getMonth())+1;
      month = month > 9 ? month : '0' + month;

      if (month != currentMonth) {
        continue;
      }

      day = date.getDate();
      day = day > 9 ? day : '0' + day;

      date_string = date.getFullYear() + '-' + month + '-' + date.getDate();

      var $showsToday = $schedule.find(dayClass).find('ul').first();

      $showsToday.find('span.details').each(function() {
        var $show = $(this);
        var time = $show.find('.time').text().cleanText();
        var title = $show.next().text().cleanText();
        var notes = $show.siblings('.note').text().cleanText();
        var price = $show.find('.price').text().cleanText();

        time = time == 'Midnight' ? '11:59pm' : time;

        schedule.push({
          'title': title,
          'price': price,
          'date': date_string + ' ' + time,
          'time': time,
          'notes': notes
        });
      }); // foreach show

    } // for days

  }); // weeks.each

  return schedule;

} // getSchedule

function buildURL(host) {
  return 'http://' + host + '/schedule/' + today.getFullYear() + '/' + currentMonth;
}

function determineTheater(host) {
  var theater = host.split('.').shift();

  if (theater === 'newyork') {
    return 'chelsea';
  }
  else if (theater === 'east') {
    return 'beast';
  }

  return 'losangeles';
}