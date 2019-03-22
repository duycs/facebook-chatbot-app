var web = {};

web.home = (req, res, next) => {
    if (!req.user) {
        res.render('login');
        return;
    }

    var async = require('async');
    var Tracking = require('../models/tracking');
    var User = require('../models/user');

    var regex = /^[0-9]{4}(-|_|\/)[0-9]{2}(-|_|\/)[0-9]{2}$/;
    var conditions = [];
    var vars = {};

    if (req.query.start_date && req.query.start_date.match(regex)) {
        conditions.push({updated_time: {$gte: new Date(req.query.start_date)}});
        vars.start_date = req.query.start_date;
    }
    if (req.query.end_date && req.query.end_date.match(regex)) {
        conditions.push({updated_time: {$lte: new Date(req.query.end_date + ' 23:59:59')}});
        vars.end_date = req.query.end_date;
    }

    //console.log(conditions);

    async.parallel({
        all_user: (cb) => {
            User.count(conditions.length ? {$and: conditions} : {}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            });
        },

        user_booking_success: (cb) => {
            User.count({$and: conditions.concat([
                {is_verified: {$exists: true}},
                {booking_sucess_num: {$exists: true}}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            });
        },

        user_booking_failure: (cb) => {
            User.count({$and: conditions.concat([
                {booking_sucess_num: {$exists: false}}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            });
        },

        all_tracking: (cb) => {
            Tracking.count(conditions.length ? {$and: conditions} : {}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            });
        },

        booking_success: (cb) => {
            Tracking.count({$and: conditions.concat([
                // {is_verified: {$exists: true}},
                // {step: 14},
                {booking_status: 1}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            });
        },

        booking_failure: (cb) => {
            Tracking.count({$and: conditions.concat([
                {booking_status: {$ne: 1}}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            });
        },

        stop_at_chat_staff: (cb) => {
            Tracking.count({$and: conditions.concat([
                {step: -1}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            });
        },

        stop_at_start: (cb) => {
            Tracking.count({$and: conditions.concat([
                {step: 1}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            });
        },
       
        stop_at_phone: (cb) => {
            Tracking.count({$and: conditions.concat([
                {phone: {$exists: false}},
                {step: 4}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            })
        },

        stop_at_enter_verify_code: (cb) => {
            Tracking.count({$and: conditions.concat([
                {step: 5}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            })
        },

        stop_at_select_service: (cb) => {
            Tracking.count({$and: conditions.concat([
                {is_verified: {$exists: true}},
                {step: 6}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            })
        },

        stop_at_confirm_cancle_booking: (cb) => {
            Tracking.count({$and: conditions.concat([
                {is_verified: {$exists: true}},
                {step: 7}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            })
        },

        stop_at_confirm_overwrite_booking: (cb) => {
            Tracking.count({$and: conditions.concat([
                {is_verified: {$exists: true}},
                {step: 8}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            })
        },

        stop_at_area: (cb) => {
            Tracking.count({$and: conditions.concat([
                {is_verified: {$exists: true}},
                {step: 9}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            })
        },

        stop_at_salon: (cb) => {
            Tracking.count({$and: conditions.concat([
                {is_verified: {$exists: true}},
                {step: 10}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            })
        },

        stop_at_date: (cb) => {
            Tracking.count({$and: conditions.concat([
                {is_verified: {$exists: true}},
                {step: 11}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            })
        },

        stop_at_stylist: (cb) => {
            Tracking.count({$and: conditions.concat([
                {is_verified: {$exists: true}},
                {step: 12}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            })
        },

        stop_at_period_time: (cb) => {
            Tracking.count({$and: conditions.concat([
                {is_verified: {$exists: true}},
                {step: 13}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            })
        },

        stop_at_time: (cb) => {
            Tracking.count({$and: conditions.concat([
                {is_verified: {$exists: true}},
                {booking_status: {$ne: 1}},
                {step: 14}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            })
        },

        is_staff_chat: (cb) => {
            Tracking.count({$and: conditions.concat([
                {is_staff_chat: true}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            })
        },

        booking_random_stylist: (cb) => {
            Tracking.count({$and: conditions.concat([
                {is_verified: {$exists: true}},
                {stylist_id: 0}
            ])}, (err, count) => {
                if (err) return cb(err);
                cb(null, count);
            })
        }

    }, (err, counts) => {
        if (err) return next(err);

        vars.counts = counts;
        res.render('index', vars);
    });
};

module.exports = web;
