/**
 * template.js
 * Message template
 */

var template = {};
var payloads = {
    pickArea: "PICK_AREA",
    pickDAte: "PICK_DATE",
    pickTime: "PICK_TIME",
    pickSalon: "PICK_SALON"
};

// card
template.card = function(item) {
    var message = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": item.title,
                    "subtitle": item.subtitle,
                    "buttons": [{
                        "type": 'postback',
                        "title": item.button_title,
                        "payload": item.button_payload
                    }]
                }]
            }
        }
    };
    return message;
};


// list horizontal cards, card has title, subtitle, button
template.listCardHorizontal = function(items) {
    var elements = [];
    var message = {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: []
            }
        }
    };

    if (!Array.isArray(items)) {
        return message;
    }

    for (let i in items) {
        let item = items[i];
        elements.push({
            title: item.title,
            image_url: item.button_image_url,
            subtitle: item.subtitle,
            buttons: [{
                type: 'postback',
                title: item.button_title,
                payload: item.button_payload
            }]
        });
    }
    message.attachment.payload.elements = elements;
    return message;
};

// list button, button has only title
template.buttons = function(title, buttons) {
    var elements = [];
    var message = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": title,
                "buttons": []
            }
        }
    };

    if (!Array.isArray(buttons)) {
        return message;
    }

    for (let i in buttons) {
        let button = buttons[i];
        elements.push({
            type: "postback",
            title: button.button_title,
            payload: button.button_payload
        });
    }

    message.attachment.payload.buttons = elements;
    return message;
};


// list button, button has only title
template.quickReplies = function(title, buttons) {
    var elements = [];
    var message = {
        "text": title,
        "quick_replies": []

    };

    if (!Array.isArray(buttons)) {
        return message;
    }

    for (let i in buttons) {
        let button = buttons[i];
        elements.push({
            content_type: "text",
            title: button.button_title,
            payload: button.button_payload
        });
    }

    message.quick_replies = elements;
    return message;
};


module.exports = template;