/**
 * bot.js
 */

'use strict';

const schedule = require('node-schedule');
const messenger = require('./messenger');
const messages = require('./messages');
const helper = require('./helper');
const consts = require('./consts');
const api = require('./api');
const template = require('./template');
const util = require('util');
const User = require('../models/user');
const Tracking = require('../models/tracking');
const timeout = 5 * 60000;
// const timeVeriryRepeat = 24 * 60 * 60000;
const timeVeriryRepeat = 5 * 60000;

//update step 2017/07
//const version = 1;

//update step 2017/08/30
const version = 2;

var constant = {
    booking: {
        new: {
            value: 0,
            title: 'Đặt lịch'
        },
        cancel: {
            value: 1,
            title: 'Huỷ lịch'
        }
    },
    choose: "Chọn"
};

var selectYesNo = [{
    "id": 0,
    "title": "Không"
}, {
    "id": 1,
    "title": "Có"
}];

var steps = {
    chatWithStaff: -1,
    nothing: 0,
    started: 1,
    reset: 2,
    enterName: 3,
    enterPhoneNumber: 4,
    enterVerifyCode: 5,
    selectService: 6,
    confirmCancleBooking: 7,
    confirmOverwriteBooking: 8,
    selectArea: 9,
    selectSalon: 10,
    selectDate: 11,
    selectStylist: 12,
    selectPeriodTime: 13,
    selectTime: 14,
    confirm: 15,
    final: 16,
    cancelBooking: 17
};

var stepsCheckTimeout = [
    steps.enterVerifyCode,
    steps.selectArea,
    steps.selectSalon,
    steps.selectDate,
    steps.selectStylist,
    steps.selectPeriodTime,
    steps.selectTime
];

var stepsNotCheckValidate = [
    steps.chatWithStaff
];

var resetCharacter = [
    "r", "reset", "khởi động lại", "khoi dong lai"
];
var askCharacter = ["hỏi", "hoi", "cho em", "?", "tư vấn", "tu van", "không ạ", "khong a", "ask", "mình", "minh", "không", "khong", "kh", "ko"];

// Schedule
var remind = schedule.scheduleJob('0,30 * * * *', function() {
    User.getForRemind(function(err, users) {
        if (err) {
            return console.log('Schedule error', err);
        }

        for (var i in users) {
            let msg = util.format(messages.remindBeforeGo, users[i].name, users[i].salon_name);
            messenger.send(users[i], msg);
        }
    });
});

// Schedule
var tracking = schedule.scheduleJob('0,*/5 * * * *', function() {
    User.find(function(err, users) {
        if (err) {
            return console.log('Schedule error', err);
        }
        for (var i in users) {
            Tracking.findByFbid(users[i], function(err, tracking, raw) {
                if (err) return console.log('==> TRACKING ERROR:', err);
            });
        }
    });
});

/** Bot module */
var bot = {
    pages: {}, // supported pages
    texts: [], // process text message
    payloads: [], // process payload message
    quickReplies: [] // process quick reply
};

// add supported page
for (var i = 0; i < consts.fb_pages.length; i++) {
    bot.pages[consts.fb_pages[i].id] = consts.fb_pages[i].salon_id;
}

// Callback structure: function(condition, logical)
// if condition return true then run logical

bot.text = function(cond, logical) {
    bot.texts.push({
        condition: cond,
        logical: logical
    });
};

bot.payload = function(cond, logical) {
    bot.payloads.push({
        condition: cond,
        logical: logical
    });
};

bot.quickReply = function(cond, logical) {
    bot.quickReplies.push({
        condition: cond,
        logical: logical
    });
};

/* Response for home */
bot.home = function(req, res) {
    res.end('Hi!');
};

/**
 * Verify app
 */
bot.getWebHook = function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === consts.TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
        return;
    }

    res.sendStatus(403);
};

// catch bot error
bot.error = function(err, event) {
    console.log('BOT ERROR', err);
    let receiver = {
        fbid: event.sender.id,
        page_fbid: event.recipient.id
    };
    messenger.send(receiver, messages.err);
};

// get started & send ask name
bot.selectService = function(user, event) {
    user.step = steps.selectService;
    user.chat_miss_num = 0;
    user.is_staff_chat = false;
    user.request_time = Date.now();
    user.updated_time = new Date();
    let choices = [];
    choices.push(constant.booking.new);
    if (user.booking_status == 1 && user.is_verified) {
        choices.push(constant.booking.cancel);
    }

    let services = choices.map(function(i) {
        return {
            button_title: i.title,
            button_payload: user.payload(user.step, i.value)
        }
    });
    user.save(function(err) {
        if (err) {
            return bot.error(err, event);
        }
        let msg = messages.selectService;
        messenger.send(user, template.buttons(msg, services));
    });
};

//start
// bot.askName = function(user, event, msg) {
//     user.step = steps.enterName;
//     user.is_verified = false;
//     user.updated_time = new Date();
//     user.save(function(err) {
//         if (err) {
//             return bot.error(err, event);
//         }
//         messenger.send(user, msg + messages.askName);
//     });
// };
bot.payload(function(payload) {
    return payload.step == steps.started;

}, function(payload, user, event) {
    if (user.exists && user.is_verified) {
        user.chat_miss_num = 0;
        user.is_staff_chat = false;
        user.step = steps.selectService;
        user.save(function(err) {
            if (err) {
                return bot.error(err, event);
            }
        });
        bot.genQuickReply(user, event);
        return;
    }

    if (!user.phone) {
        bot.askPhone(user, event);
    } else {
        bot.enterVerifyCode(user, event);
    }
});

bot.start = function(user, event) {
    bot.askPhone(user, event);
}

// reset
bot.payload(function(payload) {
    return payload.step == steps.reset;

}, function(payload, user, event) {
    if (user.is_verified) {
        if (user.booking_status == 1) {
            bot.selectService(user, event);
        } else {
            bot.selectArea(user, event);
        }
    } else {
        bot.checkValid(user, event);
    }
});

bot.payload(function(payload) {
    return payload.step == steps.chatWithStaff;

}, function(payload, user, event) {
    user.request_time = Date.now();
    user.is_staff_chat = true;
    user.chat_miss_num = 0;
    user.save(function(err) {
        if (err) {
            return bot.error(err, event);
        }
        messenger.send(user, messages.pleaseAskStaff);
    });
});

// process new booking or cancel last booking
bot.selectArea = function(user, event) {
    user.chat_miss_num = 0;
    user.step = steps.selectArea;
    user.request_time = Date.now();
    user.is_staff_chat = false;
    user.booking_status = -1;
    user.updated_time = new Date();
    user.save(function(err) {
        if (err) {
            return bot.error(err, event);
        }

        api.getSalons({}, function(err, rres, body) {
            let areas = body.locations.map(function(i) {
                return {
                    button_title: i.city.name,
                    button_payload: user.payload(steps.selectArea, {
                        id: i.city.id,
                        name: i.city.name
                    })
                }
            });
            messenger.send(user, template.buttons(messages.pickArea, areas));
        });
    });
};

// enter enterVerifyCode
bot.enterVerifyCode = function(user, event) {
    let code = helper.random(1000, 9999) + "";
    user.step = steps.enterVerifyCode;
    user.verification_code = code;
    user.updated_time = new Date();
    user.save(function(err) {
        if (err) {
            return bot.error(err, event);
        }
        let query = {
            phone: user.phone,
            code: code,
            fid: user.fbid,
            name: user.name
        };
        api.verify(query, function(err, rres, body) {
            messenger.send(user, messages.askVerifyCode);
        });
    });
};


// select service
bot.payload(function(payload, user) {
    return payload.step == steps.selectService;

}, function(payload, user, event) {
    //check if overwrite booking
    let isBooking = user.booking_status;
    // let query = {
    //     phone: user.phone,
    //     type: "booked"
    // };
    // api.getCheck(query, function(err, rres, body) {
    //     if (body == true || body == "true") {
    //         isBooking = true;
    //     }

    // new booking & send area list
    if (payload.value == constant.booking.new.value) {
        if (isBooking == 1) {
            bot.confirmOverwriteBooking(user, event);
        } else {
            bot.selectArea(user, event);
        }
        return;
    }

    //cancel booking
    if (isBooking == 1) {
        bot.confirmCancleBooking(user, event);
    } else {
        messenger.send(user, messages.notHaveBooking);
    }
    // });
});

bot.confirmOverwriteBooking = function(user, event) {
    user.step = steps.confirmOverwriteBooking;
    user.updated_time = new Date();
    user.save(function(err) {
        let confirms = selectYesNo.map(function(i) {
            return {
                button_title: i.title,
                button_payload: user.payload(steps.confirmOverwriteBooking, {
                    id: i.id,
                    title: i.title
                })
            };
        });

        let msg = messages.confirmOverwriteBooking;
        messenger.send(user, template.buttons(msg, confirms));
    });
};


bot.confirmCancleBooking = function(user, event) {
    user.step = steps.confirmCancleBooking;
    user.updated_time = new Date();
    user.save(function(err) {
        if (err) {
            return bot.error(err, event);
        }
        // cancel recent booking
        let confirms = selectYesNo.map(function(i) {
            return {
                button_title: i.title,
                button_payload: user.payload(steps.confirmCancleBooking, {
                    id: i.id,
                    title: i.title
                })
            };
        });
        let msg = messages.confirmCancleBooking;
        messenger.send(user, template.buttons(msg, confirms));
    });
};

// message after yes cancle
bot.payload(function(payload) {
    return payload.step == steps.confirmCancleBooking;

}, function(payload, user, event) {
    if (payload.value.id == 1) {
        user.booking_status = 0;
        user.updated_time = new Date();
        user.save(function(err) {
            if (err) {
                return bot.error(err, event);
            }
            // let query = {
            //     DatedBook: helper.formatDate(user.booking_date, "yyyy_MM_dd"),
            //     CustomerPhone: user.phone
            // };
            // api.deleteBooking(query, function(err, rres, body) {
            //     messenger.send(user, messages.cancelSuccess);
            // });
            let query = '{DatedBook : "' + helper.formatDate(user.booking_date, "yyyy_MM_dd") +
                '", CustomerPhone : "' + user.phone + '"}';
            api.deleteBooking(query, function(err, status, header, body) {
                messenger.send(user, messages.cancelSuccess);
                user.step = steps.selectService;
                user.updated_time = new Date();
                user.save(function(err) {
                    if (err) {
                        return bot.error(err, event);
                    }
                    bot.selectService(user, event);
                    //bot.genQuickReply(user, event);
                });
            });
        });
    } else {
        //do nothing
    }
});

// message after yes confirmOverwriteBooking
bot.payload(function(payload) {
    return payload.step == steps.confirmOverwriteBooking;

}, function(payload, user, event) {
    if (payload.value.id == 1) {
        bot.selectArea(user, event);
        return;
    }

    user.step = steps.selectService;
    user.save(function(err) {
        if (err) {
            return bot.error(err, event);
        }
    });
});

// save area & send salon list
bot.selectSalon = function(user, event, isEmpty) {
    if (isEmpty) {
        messenger.send(user, messages.emptyBookTime);
    }

    user.step = steps.selectSalon;
    user.updated_time = new Date();
    user.save(function(err) {
        if (err) {
            return bot.error(err, event);
        }

        messenger.send(user, messages.pickSalon);
        api.getSalons({}, function(err, rres, body) {
            let salons = body.locations.filter(function(i) {
                return i.city.id == user.area_id;
            });

            // let this page on first
            salons = salons[0].salons;
            let index = salons.findIndex((x) => x.id == bot.pages[user.page_fbid]);
            if (index >= 0) {
                let first = salons[index];
                salons.splice(index, 1);
                salons.unshift(first);
            }

            salons = salons.map(function(i) {
                let subtitle = "Hotline: %s\nĐịa chỉ: %s";
                subtitle = util.format(subtitle, i.hotline, i.address);
                return {
                    title: i.name,
                    subtitle: subtitle,
                    button_title: 'Chọn',
                    button_image_url: i.Img_Map,
                    button_payload: user.payload(user.step, {
                        id: i.id,
                        name: i.name
                    })
                }
            });

            let offset = 0;
            let limit = 10;
            while (offset < salons.length) {
                let items = salons.slice(offset, offset + limit);
                offset += limit;
                messenger.send(user, template.listCardHorizontal(items));
            }
        });
    });
};


// save area & send salon list
bot.payload(function(payload) {
    return payload.step == steps.selectArea;

}, function(payload, user, event) {
    user.area_id = payload.value.id;
    user.area_name = payload.value.name;

    bot.selectSalon(user, event, false);
});

// save salon & send date picker
bot.payload(function(payload) {
    return payload.step == steps.selectSalon;

}, function(payload, user, event) {
    user.salon_id = payload.value.id;
    user.salon_name = payload.value.name;
    user.step = steps.selectDate;
    user.updated_time = new Date();
    user.save(function(err) {
        if (err) {
            return bot.error(err, event);
        }

        let now = new Date();
        let day = 86400000;
        let selectDates = [{
            "id": 1,
            "title": "Hôm nay",
            "date": now
        }, {
            "id": 2,
            "title": "Ngày mai",
            "date": new Date(now.getTime() + day)
        }, {
            "id": 3,
            "title": "Ngày kia",
            "date": new Date(now.getTime() + 2 * day)
        }];
        let dates = selectDates.map(function(i) {
            return {
                button_title: i.title,
                button_payload: user.payload(user.step, {
                    id: i.id,
                    name: i.title,
                    date: i.date.getTime()
                })
            }
        });
        messenger.send(user, template.buttons(messages.pickDate, dates));
    });
});

// save date & send stylist list
bot.payload(function(payload) {
    return payload.step == steps.selectDate;

}, function(payload, user, event) {

    let query = {
        said: user.salon_id,
        bookdate: helper.formatDate(new Date(payload.value.date), "yyyy_MM_dd")
    };
    api.getStylists(query, function(err, rres, body) {
        if (body.stylists && body.stylists.length > 0) {
            messenger.send(user, messages.selectStylist);

            user.step = steps.selectStylist;
            user.date_id = payload.value.id;
            user.date_name = payload.value.name;
            user.booking_date = new Date(payload.value.date);
            user.updated_time = new Date();

            let item0 = {
                title: "Stylist ngẫu nhiên",
                //subtitle: "Chọn một stylist ngẫu nhiên cho bạn",
                button_title: 'Chọn',
                button_payload: user.payload(user.step, {
                    id: 0,
                    name: "ngẫu nhiên"
                })
            };
            let length = ~~body.stylists.length;
            let balance = length % 10;
            let rows = Math.floor(length / 10);
            let increase = 9;
            let k = 0;
            // stylists.splice(0, 0, item0);
            if (balance > 0) {
                rows = rows + 1;
            }
            let stylistsRow = [];
            for (let i = 0; i < rows; ++i) {
                if (k + increase < length) {
                    stylistsRow = body.stylists.slice(k, k + increase).map(function(i) {
                        return {
                            title: i.name,
                            subtitle: "",
                            button_title: 'Chọn',
                            button_payload: user.payload(user.step, {
                                id: i.id,
                                name: i.name
                            })
                        }
                    });

                    k = k + increase;
                } else {
                    stylistsRow = body.stylists.slice(k, length).map(function(i) {
                        return {
                            title: i.name,
                            subtitle: "",
                            button_title: 'Chọn',
                            button_payload: user.payload(user.step, {
                                id: i.id,
                                name: i.name
                            })
                        }
                    });

                }
                if (i == 0) {
                    stylistsRow.splice(0, 0, item0);
                }
                messenger.send(user, template.listCardHorizontal(stylistsRow));
            }

            user.save(function(err) {
                if (err) {
                    return bot.error(err, event);
                }
            });
            return;
        }
        let msg = util.format(messages.emptyBookingSalonInDay, user.salon_name, payload.value.name);
        messenger.send(user, msg);
        return;
    });
});

// save stylist & send period time list
bot.payload(function(payload) {
    return payload.step == steps.selectStylist;

}, function(payload, user, event) {
    let query = {
        said: user.salon_id,
        styleid: payload.value.id,
        bookdate: helper.formatDate(user.booking_date, "yyyy_MM_dd")
    };
    api.getTimeFree(query, function(err, rres, body) {
        user.stylist_id = payload.value.id;
        user.stylist_name = payload.value.name;
        user.step = steps.selectPeriodTime;
        user.updated_time = new Date();
        if (body.time_free.length && body.time_free.length > 0) {
            let periods = body.time_free.map(function(i) {
                return {
                    button_title: i.period.name,
                    button_payload: user.payload(user.step, {
                        id: i.period.id,
                        name: i.period.name
                    })
                }
            });
            messenger.send(user, template.buttons(messages.pickPeriodTime, periods));
            user.save(function(err) {
                if (err) {
                    return bot.error(err, event);
                }
            });
            return;
        }

        bot.selectSalon(user, event, true);
        return;
    });
});

// save time period && time hour
bot.payload(function(payload) {
    return payload.step == steps.selectPeriodTime;

}, function(payload, user, event) {
    let query = {
        said: user.salon_id,
        styleid: user.stylist_id,
        bookdate: helper.formatDate(user.booking_date, "yyyy_MM_dd")
    };
    api.getTimeFree(query, function(err, rres, body) {
        user.period_time_id = payload.value.id;
        user.step = steps.selectTime;
        user.updated_time = new Date();
        let time = body.time_free.filter(function(i) {
            return i.period.id == user.period_time_id;
        });
        if (time[0] && time[0].times && time[0].times.length > 0) {
            let times = time[0].times.map(function(i) {
                return {
                    button_title: i.time,
                    button_payload: user.payload(user.step, {
                        id: i.id,
                        name: i.time
                    })
                };
            });
            let msg = util.format(messages.pickTime, user.stylist_name);
            messenger.send(user, template.quickReplies(msg, times));
            user.save(function(err) {
                if (err) {
                    return bot.error(err, event);
                }
            });
            return;
        }
        messenger.send(user, messages.emptyBookTime);
    });

});

//gen quick reply
/*
bot.genQuickReply = function(user, event) {

    user.step = steps.chatWithStaff
    user.request_time = Date.now();
    user.updated_time = new Date();

    user.save(function(err) {
        if (err) {
            return bot.error(err, event);
        }
    });

    let msg = messages.askGuessWhat;
    let actions = [];
    if (!user.phone) {
        actions.push({
            key: 1,
            value: 'Nhập lại số điện thoại'
        });
    } else if (!user.is_verified) {
        actions.push({
            key: 1,
            value: 'Gửi lại mã xác thực'
        });
    } else if (user.is_verified) {
        actions.push({
            key: 1,
            value: 'Đặt lịch cắt tóc'
        });
    }
    actions.push({
        key: 2,
        value: 'Chat với tư vấn viên'
    });

    let items = actions.map(function(i) {
        return {
            button_title: i.value,
            button_payload: user.payload(user.step, {
                id: i.key,
                name: i.value
            })
        };
    });
    messenger.send(user, template.quickReplies(msg, items));
};
*/
//enter verify or chat with staff
bot.quickReply(function(payload) {
    return payload.step == steps.chatWithStaff || payload.step == steps.selectService;

}, function(payload, user, event) {
    if (payload.value.id === 1) {
        if (!user.phone) {
            bot.askPhone(user, event);
            return;
        }
        if (!user.is_verified) {
            bot.enterVerifyCode(user, event);
            return;
        }
        if (user.is_verified) {
            if (user.booking_status === 1) {
                bot.selectService(user, event);
            } else {
                bot.selectArea(user, event);
            }
            return;
        }
    }
    if (payload.value.id === 2) {
        user.is_staff_chat = true;
        user.chat_miss_num = 0;
        user.save(function(err) {
            if (err) {
                return bot.error(err, event);
            }
            messenger.send(user, messages.pleaseAskStaff);
        });
        return;
    }
});

// save time & send info message
bot.quickReply(function(payload) {
    return payload.step == steps.selectTime;

}, function(payload, user, event) {
    let part = payload.value.name.split(':');
    let date = user.booking_date;
    let time = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    time.setHours(parseInt(part[0]));
    time.setMinutes(parseInt(part[1]));
    time.setSeconds(0);
    time.setMilliseconds(0);

    user.hour_id = payload.value.id;
    user.hour_name = payload.value.name;
    user.booking_status = 1;
    user.booking_date = time;
    user.request_time = Date.now();
    user.updated_time = new Date();
    user.booking_sucess_num = user.booking_sucess_num ? user.booking_sucess_num + 1 : 1;

    user.save(function(err) {
        if (err) {
            return bot.error(err, event);
        }

        let query = '{SalonId : "' + user.salon_id + '" , StylistId : "' + user.stylist_id +
            '", DatedBook : "' + helper.formatDate(user.booking_date, "yyyy_MM_dd") +
            '", CustomerPhone : "' + user.phone +
            '", CustomerName : "' + user.name + '", HourId : "' + user.hour_id + '"}';

        api.postBooking(query, function(err, status, header, body) {
            //title has a 80 character limit
            //subtitle has a 80 character limit
            //buttons is limited to 3
            let subtitle = 'Địa chỉ: %s\nThời gian: %s\nStylist: %s';
            let time = '%s ngày %s';
            time = util.format(time, user.hour_name, helper.formatDate(user.booking_date, "dd/MM"));
            subtitle = util.format(subtitle, user.salon_name, time, user.stylist_name);

            let card = {
                title: messages.bookSuccess,
                subtitle: subtitle,
                button_title: "Hủy lịch",
                button_payload: user.payload(steps.selectService, {
                    id: 1
                })
            };
            let msg = "%s\n%s";
            msg = util.format(msg, util.format(messages.thanksBooking, user.name), messages.remindCustomer);
            messenger.send(user, msg);
            messenger.send(user, template.card(card));
        });
    });

    Tracking.findByFbid(user, function(err, tracking, raw) {});

});


// enter name
bot.askPhone = function(user, event) {
    messenger.user(user, (err, rres, body) => {
        if (err) {
            return bot.error(err, event);
        }
        user.name = util.format('%s %s',
            body.last_name ? body.last_name : '',
            body.first_name ? body.first_name : ''
        ).trim();
        user.step = steps.enterPhoneNumber;
        user.updated_time = new Date();
        user.save(function(err) {
            if (err) {
                return bot.error(err, event);
            }
            messenger.send(user, util.format(messages.hello, user.name));
        });
    });
};

//enter name
// bot.text(function(user) {
//     return user.step === steps.enterName;

// }, function(user, event) {

//     if (!helper.isValidName(event.message.text)) {
//         messenger.send(user, messages.nameInvalid);
//         return;
//     }

//     user.name = event.message.text;
//     bot.askPhone(user, event, '');
// });

// enter phone number
bot.text(function(user) {
    return user.step === steps.enterPhoneNumber;

}, function(user, event) {
    // check validate phone
    let phone = helper.phoneNumber(event.message.text);
    if (phone) {
        user.phone = phone;
        user.save(function(err) {
            if (err) {
                return bot.error(err, event);
            }
            bot.enterVerifyCode(user, event);
        });
        return;
    }

    if (user.verify_phone_num < 1) {
        user.verify_phone_num = user.verify_phone_num + 1;
        user.save(function(err) {
            if (err) {
                return bot.error(err, event);
            }
            messenger.send(user, messages.phoneInvalid);
        });
        return;
    } else {
        bot.checkValid(user, event);
    }
});


// enter verification code
bot.text(function(user) {
    return user.step === steps.enterVerifyCode;

}, function(user, event) {
    if (user.verification_code === event.message.text) {
        //post status verified
        let query = util.format('{phone:"%s"}', user.phone);
        api.verified(query, function(err, status, header, body) {
            user.is_verified = true;
            user.updated_time = new Date();
            user.save();
        });
        bot.selectArea(user, event);
        return;
    }

    if (user.verify_code_num < 1) {
        user.verify_code_num = user.verify_code_num + 1;
        user.updated_time = new Date();
        user.save(function(err) {
            if (err) {
                return bot.error(err, event);
            }
        });
        messenger.send(user, messages.verifyError);
        return;
    } else {
        bot.checkValid(user, event);
    }
});


//reset
bot.text(function(user, text) {
    let check = false;
    if (resetCharacter.indexOf(text.toLowerCase()) >= 0)
        check = true;
    return check;

}, function(user, event) {
    if (user.is_verified) {
        bot.selectService(user, event);
    } else {
        bot.checkValid(user, event);
    }
});

// simsimi or sorry Cannot Rep or chatwith staff
bot.text(function(user, text) {
    let check = false;
    if (resetCharacter.indexOf(text.toLowerCase()) < 0)
        check = true;
    return check;

}, function(user, event) {
    // let query = {
    //     key: consts.SIMSIMI_KEY,
    //     lc: 'vi',
    //     ft: 1.0,
    //     text: event.message.text
    // };
    // api.simsimi(query, function(err, rres, body) {
    //     console.log(body);
    //     if (body.result === 100) {
    //         messenger.send(user, body.response);
    //         return;
    //     }
    //     messenger.send(user, messages.sorryCannotRep);
    //     return;
    // });
    if (!user.is_staff_chat) {
        if (!user.is_verified) {
            bot.checkValid(user, event);
            return;
        }

        if (user.chat_miss_num < 1) {
            user.chat_miss_num = user.chat_miss_num + 1;
            user.updated_time = new Date();
            user.save(function(err) {
                if (err) {
                    return bot.error(err, event);
                }
            });
        } else {
            bot.genQuickReply(user, event);
        }
    }

});

bot.isOutOfTime = function(user, event) {
    if (stepsCheckTimeout.indexOf(user.step) >= 0) {
        let interval = new Date().getTime() - user.updated_time.getTime();
        if (interval > timeout) {
            messenger.send(user, messages.timeoutRequireReset);
            bot.selectArea(user, event);
            return true;
        }
    }
    return false;
};

bot.checkValid = function(user, event) {
    if (!user.is_verified) {
        let interval = new Date().getTime() - user.verify_date.getTime();
        // console.log("=>INTERVAL: " + interval);
        // if (!user.step && (interval > timeVeriryRepeat)) {
        user.request_time = Date.now();
        user.verify_date = Date.now();
        user.verify_phone_num = 0;
        user.verify_code_num = 0;
        user.save(function(err) {
            if (err) {
                return bot.error(err, event);
            }
            bot.genQuickReply(user, event);
        });
    }
};

/* Process message */
bot.postWebHook = function(req, res) {
    var data = req.body;
    // console.log('=> DATA', data);
    if (data.object !== 'page') {
        res.sendStatus(200);
        return; // Make sure this is a page subscription
    }
    if (data && data.entry) {
        data.entry.forEach(function(entry) {
            // Iterate over each messaging event
            if (entry && entry.messaging) {
                entry.messaging.forEach(function(event) {
                    bot.process(event);
                });
            }
        });
    }
    res.sendStatus(200);
};

bot.process = function(event) {
    // console.log('=> EVENT', event);

    // do nothing if is echo message or delivery message
    if ((event.message && event.message.is_echo) ||
        event.delivery ||
        event.read ||
        !bot.pages[event.recipient.id]) {
        return;
    }

    User.findByFbid(event.sender.id, event.recipient.id, function(err, user, raw) {

        // check error
        if (err) {
            return bot.error(err, event);
        }

        // check step started
        if (!user.step) {
            user.chat_miss_num = 0;
            user.is_staff_chat = false;
            user.step = steps.started;
            user.request_time = Date.now();
        }

        // check valid
        // if (!bot.checkValid(user, event)) {
        //     return;
        // }

        var run = () => {
            let isPayload = !event.message && event.postback && event.postback.payload;
            let isQuickRep = event.message && event.message.quick_reply && event.message.quick_reply.payload;

            // quick reply message or payload message
            if (isPayload || isQuickRep) {
                let payload = null;
                try {
                    payload = JSON.parse(isPayload ? event.postback.payload : event.message.quick_reply.payload);
                } catch (error) {}

                // do nothing without payload data
                if (!payload || payload.step === undefined || payload.step === null) {
                    return;
                }

                // only check timeout if payload in steps need to check
                if (user.exists && stepsCheckTimeout.indexOf(payload.step) >= 0) {
                    //check timeout
                    if (bot.isOutOfTime(user, event)) {
                        return;
                    }

                    // check click old message
                    if (user.request_time > payload.time // if new booking
                        ||
                        (user.request_time == payload.time && user.booking_status != -1)) { // if done booking but dont create new

                        messenger.send(user, messages.requireNewBooking);
                        bot.selectService(user, event);
                        return;
                    }
                }

                let funcs = isPayload ? 'payloads' : 'quickReplies';
                for (let i in bot[funcs]) {
                    if (bot[funcs][i].condition(payload, user)) {
                        bot[funcs][i].logical(payload, user, event);
                        return;
                    }
                }
                return;
            }

            // text message
            if (event.message && event.message.text) {
                for (let i in bot.texts) {
                    if (bot.texts[i].condition(user, event.message.text)) {
                        bot.texts[i].logical(user, event);
                        return;
                    }
                }
            }
        };

        // check exist user
        if (raw.lastErrorObject && raw.lastErrorObject.updatedExisting) {
            user.exists = true;
            run();
            return;
        }

        // not exist => get user info
        messenger.user(user, function(err, rres, body) {
            user.name = util.format('%s %s',
                body.last_name ? body.last_name : '',
                body.first_name ? body.first_name : ''
            ).trim();

            user.save(function(err) {
                if (err) {
                    return bot.error(err, event);
                }
                run();
            });
        });

        // attachment
        // if (event.message && event.message.attachments) {}

    });
};

module.exports = bot;