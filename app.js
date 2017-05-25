const meetup = require('./lib/meetup');
const twitter = require('./lib/twitter');
const Cache = require('./lib/cache');
const Log = require('./lib/log');

const argv = require('minimist')(process.argv.slice(2));

const twit = new twitter.createConnection({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const meet = meetup.createConnection(process.env.MEETUP_API_KEY);

function run() {
  if (argv.follow) {
    followMeetupMembers(argv.p);
  }
  if (argv.tweet) {
    tweetTodaysMeetups(argv['dry-run']);
  }
  if (!argv.follow && !argv.tweet) {
    Log.error('You need to chose either --tweet and/or --follow')
  }
}

function tweetTodaysMeetups(dryRun) {
  Log.info('Contacting meetup.com');
  Log.info('Requesting events for group: ' + process.env.MEETUP_GROUP_NAME);
  meet.getTodaysMeetups(process.env.MEETUP_GROUP_NAME, function(err, meetups) {
    if (err) {
      return Log.error(err.message);
    }    

    Log.success('Retreived ' + meetups.length + ' events from meetup');

    for (let i = 0; i < meetups.length; i++) {
      const meetup = meetups[i];
      const status = getTwitterStatus(meetup);

      if (dryRun) {
        Log.info('Would have tweeted: ' + status);
      } else {
        Log.info(`Tweeting "${status}"`);
        twit.tweet(getTwitterStatus(meetup), {
          lat: meetup.venue.lat,
          long: meetup.venue.lon
        }, function(err, success) {
          if (err) {
            return Log.error(err.message);
          }

          Log.success(`Tweet sent!`);
        });
      }
    }
  });
}

function getTwitterStatus(meetup) {
  const time = new Date(meetup.time).toLocaleString('en-GB', { 
    hour12: true, hour: 'numeric', minute: 'numeric' 
  }).replace(' ', ''); // no space between numbers and AM/PM

  const options = [
    `Today we're meeting at ${meetup.venue.name} from ${time}, for the ${meetup.name}!`,
    `Today we'll be at ${meetup.venue.name} from ${time}, for the ${meetup.name}!`,
    `We're meeting from ${time} for the ${meetup.name} at ${meetup.venue.name}!`,
    `Today the ${meetup.name} meets at ${meetup.venue.name} from ${time}`,
    `The ${meetup.name} is today from ${time} at ${meetup.venue.name}.`
  ];

  const status = options[Math.floor(Math.random() * options.length)];

  return status + ` ${meetup.link}`; 
}

function followMeetupMembers(pollMinutes) {
  const cache = new Cache();
  Log.info('Contacting meetup.com');
  Log.info('Requesting twitterIds for group: ' + process.env.MEETUP_GROUP_NAME);
  meet.getMemberTwitterIds(process.env.MEETUP_GROUP_NAME, function(err, resp) {
    if (err) {
      Log.error(err.message);
      return scheduleFollow(pollMinutes);
    }

    Log.success('Retreived ' + resp.length + ' twitter names from meetup');
    for (let i=0; i<resp.length; i++) {
      // need to clean the names, some people write twitter.com/pezmc
      let raw = resp[i];
      if (raw.indexOf('\.com\/') !== -1) {
        raw = raw.split('\.com\/')[1];
      }
      if (raw) cache.add('meetup', raw);
    }
    Log.info('Contacting twitter.com');
    twit.getFollowedNames(function(err, resp) {
      if (err) {
        Log.error(err.message); 
        return scheduleFollow(pollMinutes);
      }
        
      Log.success('Retreived ' + resp.length + ' twitter names from twitter');
      for (let i=0; i<resp.length; i++) {
        cache.add('twitter', resp[i]);
      }
      let diff = cache.diff();
      if (diff.length > 0) {
        Log.info('Attempting to follow ' + diff.length + ' twitter names (' + diff.join() + ')');
        twit.followNames(diff, function(err, resp) {
          if (err) {
            Log.error(err.message);
            return scheduleFollow(pollMinutes);;
          }

          Log.success('All done!');
          scheduleFollow(pollMinutes);
        });
      } else {
        Log.success('Nobody to follow');
        scheduleFollow(pollMinutes);
      }
    });
  });
}

function scheduleFollow(minutes) {
  if (!minutes) {
    return Log.info('Not scheduling following, -p wasn\'t set');
  }
  Log.success(`Waiting ${minutes} minutes...`);
  setTimeout(followMeetupMembers, minutes * 60000);
}

run();