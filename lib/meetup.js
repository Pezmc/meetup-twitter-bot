const request = require('request');

const Meetup = function(key) {
  this.apiKey = (key) ? key : null;
}

Meetup.prototype.getMemberTwitterIds = function(group, callback) {
  
  const self = this;
  let members = [];
  
  function getMemberPage(offset) {
    
    const opts = {
      uri: 'https://api.meetup.com/2/members',
      method: 'GET',
      qs: {
        key: self.apiKey,
        sign: 'true',
        group_urlname: group,
        only: 'name,other_services',
        page: 200
      }
    }
    
    opts.qs.offset = (offset) ? offset : 0;
    
    request(opts, function(err, res, body) {
      if(err) {
        return callback(err, null);
      }

      body = JSON.parse(body);
      if(!body.results) {
        return callback({ message: body.problem || "Meetup API returned failure" }, null);
      } 

      for(let i=0; i<body.results.length; i++) {
        members.push(body.results[i]);
      }

      if(body.meta.total_count > members.length) {
        setTimeout(function() {
          console.log('debug'.grey + `Getting page number ${offset + 1} from Meetup`);
          getMemberPage(offset + 1);
        }, 500);
      } else {
        let results = [];
        for(let i=0; i<members.length; i++) {
          let mem = members[i];
          if(mem.other_services && mem.other_services.twitter && mem.other_services.twitter.identifier) {
            // Some accounts have a leading @, others do not
            let username = mem.other_services.twitter.identifier.substring(1);
            if(username.charAt(0) === '@') {
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

module.exports.createConnection = function(opts) {
  return new Meetup(opts);
}