/**
 * Uninstall token from /services/const.js
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
        // Delete persistent menu
        (callback) => {
            let json = {
                "fields": [
                    "get_started",
                    "persistent_menu"
                ]
            };
            api('DELETE', 'messenger_profile', query, json, (err, body) => {
                callback(err, body);
            });
        }

    ], (err, result) => {
        if (err) {
            return console.log('ERROR! Page', page.id, result);
        }

        console.log('UNINSTALLED! Page', page.id);
    });
}
