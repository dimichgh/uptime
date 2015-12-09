/**
 * Slack plugin
 *
 * Notifies all events (up, down, paused, restarted) by slack
 *
 * Installation
 * ------------
 *   // in config/production.yaml
 *   plugins:
 *     - ./plugins/slack
 *
 * Usage
 * -----
 * This plugin sends an slack message each time a check is started, goes down, or goes back up.
 * When the check goes down, the email contains the error details:
 *
 * Configuration
 * -------------
 * Here is an example configuration:
 *
 *   // in config/production.yaml
 *   slack:
 *     channel:
 *       name: #npm-availability
 *       uri: https://hooks.slack.com/services/34J2G4G43/I32Y4I2Y4/43kh423kj4hk2h42h3k2343
 *     event:
 *       up:        true
 *       down:      true
 *       paused:    false
 *       restarted: false
 */
var fs         = require('fs');
var moment     = require('moment');
var CheckEvent = require('../../models/checkEvent');
var Wreck = require('wreck');

exports.initWebApp = function(options) {
  var config = options.config.slack;
  CheckEvent.on('afterInsert', function(checkEvent) {
    if (!config.event[checkEvent.message]) return;
    checkEvent.findCheck(function(err, check) {
      if (err) return console.error(err);

      var message = check.name + ' ';
      switch (checkEvent.message) {
          case 'paused':
          case 'restarted':
              message += 'was ' + checkEvent.message;
              break;
          case 'down':
              message += 'went down ' + checkEvent.details;
              break;
          case 'up':
              if (checkEvent.downtime) {
                  message += 'went back up after ' + Math.floor(checkEvent.downtime / 1000) + 's of downtime';
              } else {
                  message += 'is now up';
              }
              break;
          default:
              message += '(unknown event)';
      }
      
      Wreck.post(config.channel.uri, {
          payload: JSON.stringify({
              text: message,
              channel: config.channel.name}),
          timeout: 1000
      }, function (err, response) {
          if (err) {
              console.log('ERROR: failed to send request: ', err);
              return;
          }
          Wreck.read(res, null, function (err, body) {
              if (err) {
                  console.log('ERROR: failed to read response: ', err);
                  return;
              }
              console.log('Notified event by slack: Check ' + check.name + ' ' + checkEvent.message);
          });
      });
    });
  });
  console.log('Enabled Email notifications');
};
