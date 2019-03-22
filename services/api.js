/**
 * api.js
 */

//constants
var api = {
    code: {
        success: 200,
        ok: 100,
        badRequest: 400,
        unauthorized: 401,
        notFound: 404,
        serverError: 500
    },
    timeout: 120000,
    // url1: 'https://chatbotmsg.30shine.com/api/',
    url: 'https://service30shine.herokuapp.com/api/',
    url2: 'http://sandbox.api.simsimi.com/request.p',
    //?key=your_trial_key&lc=en&ft=1.0&text=hi
    retry: 3
};
//end constants


//common
api.request = function(method, url, query, json, callback) {
    var async = require('async');
    let uri = '';
    if (url === 'simsimi') {
        uri = api.url2;
    } else {
        uri = url.indexOf('http') === 0 ? url : api.url + url;
    }

    async.retry(api.retry, (check) => {
        var request = require('request');
        var options = {
            //uri: url.indexOf('http') === 0 ? url : api.url1 + url,
            uri: uri,
            timeout: api.timeout,
            qs: query,
            json: json,
            method: method
        };

        if (method != 'GET') {
            options.headers = {
                'Content-Type': 'application/json'
            };
        }

        request(options, function(err, res, body) {
            if (err || !res || res.statusCode != api.code.success) {
                console.log('API ERROR', err,
                    res.statusCode, url, query, json, body);
                return check(err, res, body);
            }

            try {
                body = JSON.parse(body);
            } catch (e) {}

            check(null, res, body);
        });

    }, (err, res, body) => {
        callback(err, res, body);
    });
};

api.get = function(url, query, json, callback) {
    api.request('GET', url, query, json, callback);
};

api.post = function(url, query, json, callback) {
    api.request('POST', url, query, json, callback);
};

api.delete = function(url, query, json, callback) {
    api.request('DELETE', url, query, json, callback);
};
//end common

//api 30shine
api.verify = function(params, callback) {
    api.get('verify', params, null, callback);
};

api.verified = function(data, callback) {
    api.post2('verified', data, callback);
};

api.getSalons = function(params, callback) {
    api.get('salons', params, null, callback);
};

api.getTimeFree = function(params, callback) {
    api.get('timefree', params, null, callback);
};

api.getStylists = function(params, callback) {
    api.get('stylists', params, null, callback);
};

api.getCheck = function(params, callback) {
    api.get('check', params, null, callback);
};

api.post2 = function(url, data, callback) {
    var async = require('async');

    async.retry(api.retry, (check) => {
        const http = require('https');
        const encoding = 'utf8';
        const options = {
            hostname: 'chatbotmsg.30shine.com',
            port: '443',
            path: '/api/' + url,
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            }
        };

        const request = http.request(options, (res) => {
                let buffer = [];
                let body = '';

                res.on('data', (chunk) => {
                    if (Buffer.isBuffer(chunk)) {
                        buffer.push(chunk);
                    } else {
                        body += chunk;
                    }
                }).on('end', () => {
                    if (buffer.length > 0) {
                        body = Buffer.concat(buffer).toString(encoding);
                    }

                    if (res.statusCode != api.code.success) {
                        console.log('POST2', res.statusCode, res.headers, body);
                        return check('Error', res.statusCode, res.headers, body);
                    }

                    check(null, res.statusCode, res.headers, body);
                });
            })
            .setTimeout(api.timeout)
            .on('error', (error) => {
                console.log('POST2 ERROR', url, data, error);
                check(error);
            });

        request.write(data);
        request.end();

    }, (err, code, headers, body) => {
        callback(err, code, headers, body);
    });
};

api.postBooking = (data, callback) => {
    api.post2('booking', data, callback);
};

api.deleteBooking = (data, callback) => {
    api.post2('booking/delete', data, callback);
};
//end api 30shine

//simsimi function
api.simsimi = function(params, callback) {
    api.get('simsimi', params, null, callback);
};
//end api simsimi
module.exports = api;
