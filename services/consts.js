/**
 * consts.js
 */

var consts = {
    TOKEN: "abc@123456",
    fb_pages: [{
        //main page
        id: '126642864620388',
        salon_id: 1,
        token: ''
    }, {
        //sub page
        id: '',
        salon_id: 2, 
        token: ''
    }
],
//mongo db connection string
//mongodb+srv://<username>:<password>@cluster0-majso.mongodb.net/test?retryWrites=true
    DATABASE_CONNECT: "mongodb+srv:duycs@outlook.com:abc@11223344@cluster0-majso.mongodb.net/test?retryWrites=true",
    NODEMODULESCACHE: "",
    TZ: "",
    SSL_KEY: "E:/ChatBot30Shine/bot30shine/ssl/30shine.key",
    SSL_CERT: "E:/ChatBot30Shine/bot30shine/ssl/30shine.cert",
    SIMSIMI_KEY: '227f1f82-3cfa-4ea9-b8b3-9b392db93c27'

};

module.exports = consts;
