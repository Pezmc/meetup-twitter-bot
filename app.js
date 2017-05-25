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

setInterval(run, pollMinutes * 60000);

run();