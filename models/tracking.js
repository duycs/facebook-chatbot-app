/**
 * tracking.js
 * Tracking model
 */

'use strict';

var Datasource = require('./datasource');
var Schema = Datasource.Schema;

var struct = {
    fbid: String,
    page_fbid: String,
    phone: String,
    is_verified: Boolean,
    step: Number,
    request_time: Number,
    created_time: Date,
    updated_time: Date,
    booking_status: Number, // -1: booking, 0: canceled, 1: submited
    verify_date: Date,
    booking_sucess_num: Number,
    booking_status: Number, // -1: booking, 0: canceled, 1: submited
    is_staff_chat: Boolean,
    stylist_id: Number
};


var schema = new Schema(struct);
var Tracking = Datasource.model('Tracking', schema, 'trackings');

Tracking.findByFbid = function(user, callback) {
    let options = {
        new: true,
        upsert: true,
        passRawResult: true,
    };
    let data = {
        fbid: user.fbid,
        page_fbid: user.page_fbid
    };
    if (user.request_time != undefined) {
        data.request_time = user.request_time;
    }
    if (user.phone != undefined) {
        data.phone = user.phone;
    }
    if (user.is_verified != undefined) {
        data.is_verified = user.is_verified;
    }
    if (user.step != undefined) {
        data.step = user.step;
    }
    // data.created_time = Date.now();

    if (user.updated_time != undefined) {
        data.updated_time = user.updated_time;
        data.created_time = user.updated_time;
    }
    if (user.booking_status != undefined) {
        data.booking_status = user.booking_status;
    }
    if (user.booking_sucess_num != undefined) {
        data.booking_sucess_num = user.booking_sucess_num;
    }
    if (user.booking_status != undefined) {
        data.booking_status = user.booking_status;
    }
    if (user.is_staff_chat != undefined) {
        data.is_staff_chat = user.is_staff_chat;
    }
    if (user.stylist_id != undefined) {
        data.stylist_id = user.stylist_id;
    }

    Tracking.findOneAndUpdate({
        fbid: user.fbid,
        page_fbid: user.page_fbid,
        request_time: user.request_time
    }, data, options, callback);
};

module.exports = Tracking;