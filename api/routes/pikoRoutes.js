'use strict';
module.exports = function(app) {
  var pikoController = require('../controllers/pikoController');

	app.get('/facefile', function(req, res){
		var file = __dirname + '/../../facefinder';
		res.download(file);
	});

  // findface Route
  app.route('/findface').post(pikoController.find_face);
};