/**
 * messenger.js
 */
const consts = require('./consts');

var messenger = {};

messenger.api = "https://graph.facebook.com/v2.9/";

messenger.success = 200;

messenger.request = (method, url, query, page_fbid, json, callback) => {
    var request = require('request');
    var options = {
        uri: messenger.api + url,
        qs: query || {},
        method: method

    }
    // options.qs.access_token = consts.FB_PAGE_ACCESS_TOKEN;
    let page = consts.fb_pages.filter(function(i) {
        return i.id === page_fbid;
    });
    options.qs.access_token = page[0].token;
    options.json = json ? json : undefined;

    request(options, (err, res, body) => {
        if (err || !res || res.statusCode != messenger.success || !body) {
            console.log('MESSENGER ERROR', err, res ? res.statusCode : null, json, body);
        }

        try {
            body = JSON.parse(body);
        } catch (e) {}

        if (typeof callback === 'function') {
            callback(err, res, body);
        }
    });
};

messenger._send = (page_fbid, message) => {
    messenger.request('POST', 'me/messages', {}, page_fbid, message);
};

messenger.send = (receiver, text) => {
    var message = typeof text === 'string' ? {
        text: text
    } : text;
    messenger._send(receiver.page_fbid, messenger.createMsgData(receiver.fbid, message));
};

messenger.createMsgData = (fbid, message) => {
    return {
        recipient: {
            id: fbid
        },
        message: message
    };
};

messenger.user = (receiver, callback) => {
    var query = {
        fields: 'first_name,last_name',
    };
    messenger.request('GET', receiver.fbid, query, receiver.page_fbid, null, callback);
};

module.exports = messenger;
