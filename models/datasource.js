/**
 * datasource.js
 * Mongoose instance
 */

'use strict';

var Datasource = require('mongoose');
const consts = require('../services/consts');

Datasource.Promise = global.Promise;
Datasource.connect(consts.DATABASE_CONNECT);

exports = module.exports = Datasource;
