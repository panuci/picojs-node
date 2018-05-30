'use strict';
module.exports = function(app) {
  var pikoController = require('../controllers/pikoController');

  // findface Route
  app.route('/findface').post(pikoController.find_face);
};