# Meetup.com Twitter Bot

This is a simple node.js app that polls your [meetup.com](http://www.meetup.com) group, follows any of your members with a Twitter account from your Twitter account and sends out Tweets announcing the meetups. The app contains the files necessary to run this on Heroku, making use of the scheduler as well as locally.

## Setup

1. Clone this repo and install dependencies with `npm install`
2. [Get a meetup.com API key](http://www.meetup.com/meetup_api/key/)
3. [Register your app with Twitter.com](https://dev.twitter.com/apps/new)
4. Set the environment variables. See the env.sh file for the environment variables that need to be set. You can run this script once edited to set the variables.

## Running locally

After setting the environment variables...

```bash
$ node app.js --dry-run --tweet --tweetMaxDelayMinutes 15 --follow -p 60
```

## Arguments

- `--dry-run` Disables tweeting and following and logs info instead

- `--tweet` Enables tweeting of todays meetups

  - `--tweetMaxDelayMinutes` Sets the max minutes that tweets will be delayed by before sending

- `--follow` Enables following of your meetup members

  - `-p` flag specifies the polling interval for the following

## How to use on Heroku

1. Edit the heroku.sh file and enter the proper credentials and information for meetup.com and twitter
2. [Create your node.js app on Heroku](https://devcenter.heroku.com/articles/nodejs)
3. Run the heroku.sh bash script
4. Deploy, ensure you set the default web dyno to false (`heroku ps:scale tweet_meetups=1`)
5. Enable the heroku scheduler `heroku addons:add scheduler`
6. Open the scheduler with `heroku addons:open scheduler`
	1. Add a job called `tweet_meetups` (see Procfile)
	2. Add a job called `follow_meetup_members`

You can temporarily enable the processes for debugging, remember to scale them back, or the next push will trigger them again.

1. heroku ps:scale tweet_meetups=1
2. heroku ps:scale follow\_meetup_members=1