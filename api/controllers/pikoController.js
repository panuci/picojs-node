'use strict';

var fetch = require("node-fetch");
var Canvas = require('canvas');
var Image = Canvas.Image;
const Pico = require('../models/pikoModel.js');

exports.find_face = function(req, res) {
	var pico = new Pico();

	var facefinder_classify_region = function(r, c, s, pixels, ldim) {return -1.0;};
	var cascadefile = 'https://raw.githubusercontent.com/nenadmarkus/pico/c2e81f9d23cc11d1a612fd21e4f9de0921a5d0d9/rnt/cascades/facefinder';

	fetch(cascadefile).then(function(response) {
		response.arrayBuffer().then(function(buffer) {
			var canvas = new Canvas(1280, 720);
			var ctx = canvas.getContext('2d');
			var rgbdata = req.body.image;

			var r,g,b;
			for(var i=0; i< rgbdata.length; i++){
				for(var j=0; j< rgbdata[0].length; j++){
					r = rgbdata[i][j][0];
					g = rgbdata[i][j][1];
					b = rgbdata[i][j][2];
					ctx.fillStyle = "rgba("+r+","+g+","+b+", 1)";
					ctx.fillRect( j, i, 1, 1 );
				}
			}

			var bytes = new Int8Array(buffer);
			facefinder_classify_region = pico.unpack_cascade(bytes);
			res.send(JSON.stringify(button_callback(ctx)));
		})
	})

	/*
		a function to transform an RGBA image to grayscale
	*/
	function rgba_to_grayscale(rgba, nrows, ncols) {
		var gray = new Uint8Array(nrows*ncols);
		for(var r=0; r<nrows; ++r)
			for(var c=0; c<ncols; ++c)
				// gray = 0.2*red + 0.7*green + 0.1*blue
				gray[r*ncols + c] = (2*rgba[r*4*ncols+4*c+0]+7*rgba[r*4*ncols+4*c+1]+1*rgba[r*4*ncols+4*c+2])/10;
		return gray;
	}

	/*
		this function is called each time you press the button to detect the faces
	*/
	function button_callback(ctx) {
		var rgba = ctx.getImageData(0, 0, 1280, 720).data;

		// prepare input to `run_cascade`
		var image = {
			"pixels": rgba_to_grayscale(rgba, 720, 1280),
			"nrows": 720,
			"ncols": 1280,
			"ldim": 1280
		}
		var params = {
			"shiftfactor": 0.1, // move the detection window by 10% of its size
			"minsize": 20,      // minimum size of a face (not suitable for real-time detection, set it to 100 in that case)
			"maxsize": 1000,    // maximum size of a face
			"scalefactor": 1.1  // for multiscale processing: resize the detection window by 10% when moving to the higher scale
		}
		// run the cascade over the image
		// dets is an array that contains (r, c, s, q) quadruplets
		// (representing row, column, scale and detection score)
		var dets = pico.run_cascade(image, facefinder_classify_region, params);
		// cluster the obtained detections
		dets = pico.cluster_detections(dets, 0.2); // set IoU threshold to 0.2
		// draw results
		var qthresh = 5.0 // this constant is empirical: other cascades might require a different one
		var result = [];

		for(var i=0; i<dets.length; ++i){
			// check the detection score
			// if it's above the threshold, draw it
			if(dets[i][3]>qthresh)
				result.push({x: dets[i][1], y: dets[i][0], r: dets[i][2]/2});
		}

		return result;
	}
}