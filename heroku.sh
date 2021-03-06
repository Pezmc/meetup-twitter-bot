#!/usr/bin/env bash

heroku config:add NODE_ENV="production" \
  MEETUP_API_KEY="{MEETUPAPIKEY}" \
  MEETUP_GROUP_NAME="{MEETUPGROUPNAME}" \
  TWITTER_CONSUMER_KEY="{TWITTERCONSUMERKEY}" \
  TWITTER_CONSUMER_SECRET="{TWITTERCONSUMERSECRET}" \
  TWITTER_ACCESS_TOKEN="{TWITTERACCESSTOKEN}" \
  TWITTER_ACCESS_TOKEN_SECRET="{TWITTERACCESSTOKENSECRET}" \
  TZ="Europe/London"