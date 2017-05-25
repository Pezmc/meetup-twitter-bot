const TwitterClient = require('twitter');
const Log = require('./log');

const Twitter = function(opts) {
  this.twit = new TwitterClient({
    consumer_key: opts.consumer_key,
    consumer_secret: opts.consumer_secret,
    access_token_key: opts.access_token_key,
    access_token_secret: opts.access_token_secret
  });
}

Twitter.prototype.getFollowedNames = function(callback) {
  
  const self = this;
  let batches = [];
  let screenNames = [];
  
  function makeCursoredRequest(cursor) {
    cursor = cursor || -1;

    self.twit.get('friends/list', { cursor: cursor, count: 200, skip_status: true,  }, function(err, friends, response) {
      if(err) {
        return callback(err, response);
      }

      for(let i=0; i < friends.users.length; i++) {
        screenNames.push(friends.users[i].screen_name);
      }

      if (friends.next_cursor > 0) {
        Log.debug(`Making cursored twitter request ${friends.next_cursor}`);
        setTimeout(function() {
          makeCursoredRequest(friends.next_cursor);
        }, 500);
      } else {
        return callback(null, screenNames);
      }
    });
  } 

  makeCursoredRequest(); 
}

Twitter.prototype.followNames = function(names, callback) {
  
  const self = this;
  const namesToFollow = names;
  
  function follow() {
    if(namesToFollow && namesToFollow.length > 0) {
      const name = namesToFollow.shift();
      Log.debug(' Attempting to follow user: ' + name);

      self.twit.post('friendships/create', { screen_name: name }, function(err, data, response) {
        if(!err) {
          Log.success(` Followed ${name}`);
        } else {
          Log.error(' ' + err[0].message); 
        }
        follow();
      });
    } else {
      callback(null, null);
    }
  }
  
  follow();
}

Twitter.prototype.tweet = function(message, opts, callback) {
  const defaultOpts = {
    status: message
  }

  this.twit.post('statuses/update', Object.assign(defaultOpts, opts), function(error, tweet, response) {
    callback(error, tweet);
  });
}


module.exports.createConnection = function(opts) {
  return new Twitter(opts);
}