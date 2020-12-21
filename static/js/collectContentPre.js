'use strict';

var randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

var tags = ['samdev'];

var collectContentPre = function collectContentPre(hook, context) {
	var tname = context.tname;
	var tagIndex = tags.indexOf(tname);

	////////insertEmbedPicture =======  emb_img
	var existTagId = /(?:^| )emb_img-([A-Za-z0-9]*)/.exec(context.cls);
	if (existTagId && existTagId[1]) {

		console.log(existTagId,existTagId[1],"findit")
 		context.cc.doAttrib(context.state, 'insertEmbedPicture::' + atob(existTagId[1]) ) ;//JSON.stringify({"url":"https%3A//homepages.cae.wisc.edu/%7Eece533/images/boat.png","align":"Left","size":"Small"}));
	}
	///////// embedMedia ===== emb_embedMedia
	existTagId = /(?:^| )emb_embedMedia-([A-Za-z0-9]*)/.exec(context.cls);
	if (existTagId && existTagId[1]) {

		console.log(existTagId,existTagId[1],"findit")
 		context.cc.doAttrib(context.state, 'embedMedia::' + atob(existTagId[1]) ) ;//JSON.stringify({"url":"https%3A//homepages.cae.wisc.edu/%7Eece533/images/boat.png","align":"Left","size":"Small"}));
	}
	///////// insertEmbedVideo ===== emb_video
	existTagId = /(?:^| )emb_video-([A-Za-z0-9]*)/.exec(context.cls);
	if (existTagId && existTagId[1]) {

		console.log(existTagId,existTagId[1],"findit")
		context.cc.doAttrib(context.state, 'insertEmbedVideo::' + atob(existTagId[1]) ) ;//JSON.stringify({"url":"https%3A//homepages.cae.wisc.edu/%7Eece533/images/boat.png","align":"Left","size":"Small"}));
	}
	///////// insertEmbedAudio ===== emb_audio
	existTagId = /(?:^| )emb_audio-([A-Za-z0-9]*)/.exec(context.cls);
	if (existTagId && existTagId[1]) {

		console.log(existTagId,existTagId[1],"findit")
 		context.cc.doAttrib(context.state, 'insertEmbedAudio::' + atob(existTagId[1]) ) ;//JSON.stringify({"url":"https%3A//homepages.cae.wisc.edu/%7Eece533/images/boat.png","align":"Left","size":"Small"}));
	}
};

exports.collectContentPre = collectContentPre;