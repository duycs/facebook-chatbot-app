/**
 * user.js
 * User model
 */

'use strict';

var Datasource = require('./datasource');
var Schema = Datasource.Schema;

var struct = {
    fbid: String,
    page_fbid: String,
    shine_id: Number,
    name: String,
    phone: String,
    verification_code: String,
    is_verified: {
        type: Boolean,
        default: false
    },
    step: Number,
    last_time_book: Date,
    area_id: Number,
    area_name: String,
    salon_id: Number,
    salon_name: String,
    date_id: Number,
    date_name: String,
    stylist_id: Number,
    stylist_name: String,
    period_time_id: Number,
    booking_date: Date,
    hour_id: Number,
    hour_name: String,
    request_time: Number,
    created_time: {
        type: Date,
        default: Date.now
    },
    updated_time: {
        type: Date,
        default: Date.now
    },
    booking_status: Number, // -1: booking, 0: canceled, 1: submited
    verify_date: {
        type: Date,
        default: Date.now
    },
    verify_phone_num: {
        type: Number,
        default: 0
    },
    verify_code_num: {
        type: Number,
        default: 0
    },
    chat_miss_num: {
        type: Number,
        default: 0
    },
    is_staff_chat: {
        type: Boolean,
        default: false
    },
    booking_sucess_num: Number
};


var schema = new Schema(struct);
schema.methods.payload = function(step, data) {
    return JSON.stringify({
        time: this.request_time,
        step: step,
        value: data
    });
};

var User = Datasource.model('User', schema, 'users');

User.findByFbid = function(fbid, page_fbid, callback) {
    let options = {
        new: true,
        upsert: true,
        passRawResult: true,
    };
    User.findOneAndUpdate({
        fbid: fbid,
        page_fbid: page_fbid
    }, {
        fbid: fbid,
        page_fbid: page_fbid
    }, options, callback);
};

User.getForRemind = function(callback) {
    let diff = 30; // minute
    let odd = 5; // minute
    let now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);

    let min = new Date(now.getTime() + (diff - odd) * 60000);
    let max = new Date(now.getTime() + (diff + odd) * 60000);

    let conds = {
        booking_status: 1,
        booking_date: {
            $gt: min,
            $lt: max
        }
    };
    User.find(conds, callback);
};

module.exports = User;