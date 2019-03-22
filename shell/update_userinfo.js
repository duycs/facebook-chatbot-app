/**
 * Update user info.
 * (Bug 2017-09-18)
 */

let util = require('util');
let User = require('../models/user');
let messenger = require('../services/messenger');

let query = {$or: [{
        name: 'undefined undefined'
    }, {
        name: {$exists: false}
    }
]};

let time = 0;

User.find(query, (err, users) => {
    if (err) return console.log('Find user error', err);

    for (var i in users) {
        let user = users[i];
        if (!user.fbid || !user.page_fbid) {
            continue;
        }

        setTimeout(() => {
            messenger.user(user, function(err, res, body) {
                if (err || !body) {
                    return console.log('Messenger Error', err, res.statusCode, body);
                }

                console.log('BODY', body);
                user.name = util.format('%s %s', body.last_name, body.first_name);
                user.save((err) => {
                    if (err) return console.log('Save user error', err);
                });
            });
        }, time++ * 200);
    }
});
