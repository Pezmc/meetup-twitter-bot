const Log = require('./log');
const request = require('request');

const Meetup = function(key) {
  this.apiKey = (key) ? key : null;
}

Meetup.prototype.getRequestOpts = function(path, opts) {
  const defaultOpts = {
    key: this.apiKey,
    sign: 'true',
    page: 200
  }

  return {
    uri: `https://api.meetup.com/${path}`,
    method: 'GET',
    qs: Object.assign(defaultOpts, opts)
  }
}

Meetup.prototype.get = function(path, opts, callback) {
  request(this.getRequestOpts(path, opts), function(err, res, body) {
    if (err) {
      return callback(err, null);
    }

    body = JSON.parse(body);
    if (body.problem) {
      return callback({ message: body.problem || "Meetup API v2 returned failure" }, null);
    }

    if (body.errors) {
      return callback({ message: body.errors[0].message || "Meetup API v3 returned failure" }, null);
    }

    return callback(err, body)
  });
}

Meetup.prototype.getMemberTwitterIds = function(group, callback) {
  const self = this;
  let members = [];

  function getMemberPage(offset) {
    self.get('2/members', { 
      only: 'name,other_services',
      group_urlname: group,
      offset: offset ? offset : 0
    }, function(err, body) {
      if (err) {
        return callback(err, null);
      }

      for (let i = 0; i < body.results.length; i++) {
        members.push(body.results[i]);
      }

      if (body.meta.total_count > members.length) {
        setTimeout(function() {
          Log.debug(`Getting page number ${offset + 1} from Meetup`);
          getMemberPage(offset + 1);
        }, 500);
      } else {
        let results = [];
        for (let i = 0; i < members.length; i++) {
          let mem = members[i];
          if (mem.other_services && mem.other_services.twitter && mem.other_services.twitter.identifier) {
            // Some accounts have a leading @, others do not
            let username = mem.other_services.twitter.identifier.substring(1);
            if (username.charAt(0) === '@') {
             username = username.substr(1);
            }

            results.push(username);
          }
        }
        callback(null, results);
      }
    });
  }
  
  getMemberPage(0);
}

Meetup.prototype.getTodaysMeetups = function(group, callback) {
  this.get(`/${group}/events`, {
    scroll: 'next_upcoming',
    page: '3',
    status: 'upcoming',
    only: 'name,time,venue,link,visibility'
  }, function(err, body) {
    if (err) {
      return callback(err, null);
    }

    const todaysMeetups = [];
    for (let i = 0; i < body.length; ++i) {
      const meetup = body[i];

      if (new Date(meetup.time).toDateString() === new Date().toDateString()) {
        todaysMeetups.push(meetup);
      }
    }

    callback(null, todaysMeetups);
  });
}

module.exports.createConnection = function(opts) {
  return new Meetup(opts);
}