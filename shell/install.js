/**
 * Install token from /services/const.js
 */

let async = require('async');
let request = require('request');
let consts = require('../services/consts');

let api = (method, url, query, json, callback) => {
    var options = {
        uri: 'https://graph.facebook.com/v2.9/me/' + url,
        qs: query || {},
        json: json ? json : undefined,
        method: method,
        headers: {
            "Content-Type": "application/json",
        },
    };

    request(options, (err, res, body) => {
        if (err || !res || res.statusCode != 200 || !body) {
            return callback(err ? err : Error('UNKNOW ERROR'), body);
        }

        try {
            body = JSON.parse(body);
        } catch (e) {}

        if (typeof callback === 'function') {
            callback(err, res, body);
        }
    });
}

for (let i in consts.fb_pages) {
    let page = consts.fb_pages[i];
    let query = {access_token: page.token};
    
    async.waterfall([
        // Subscribed apps
        (callback) => {
            api('POST', 'subscribed_apps', query, null, (err, body) => {
                callback(err, body);
            });
        },

        // Create get started button
        (before, callback) => {
            let json = {
                "get_started": {
                    "payload": "{\"step\": 1, \"value\": null}"
                }
            };
            api('POST', 'messenger_profile', query, json, (err, body) => {
                callback(err, body);
            });
        },

        // White domains
        (before, callback) => {
            let json = {
                "setting_type": "domain_whitelisting",
                "domain_action_type": "add",
                "whitelisted_domains": [
                    "http://30shine.com",
                    "https://30shine.com",
                    "http://www.30shine.com",
                    "https://www.30shine.com"
                ]
            };
            api('POST', 'thread_settings', query, json, (err, body) => {
                callback(err, body);
            });
        },

        // Delete persistent menu
        (before, callback) => {
            let json = {
                "fields": [
                    "persistent_menu"
                ]
            };
            api('DELETE', 'messenger_profile', query, json, (err, body) => {
                callback(err, body);
            });
        },

        // Create persistent menu
        (before, callback) => {
            let json = {
                "persistent_menu": [
                    {
                        "locale": "default",
                        "call_to_actions": [
                            {
                                "title": "Đặt / huỷ lịch",
                                "type": "postback",
                                "payload": "{\"step\": 2, \"value\": null}"
                            },
                            {
                                "title": "Chat với tư vấn viên",
                                "type": "postback",
                                "payload": "{\"step\": -1, \"value\": null}"
                            }
                        ],
                        "composer_input_disabled": false
                    }
                ]
            };
            api('POST', 'messenger_profile', query, json, (err, body) => {
                callback(err, body);
            });   
        }

    ], (err, result) => {
        if (err) {
            return console.log('ERROR! Page', page.id, result);
        }

        console.log('DONE! Page', page.id);
    });
}
