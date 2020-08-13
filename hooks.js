var path = require('path'), 
    express = require('ep_etherpad-lite/node_modules/express'),
    eejs = require("ep_etherpad-lite/node/eejs");
    Busboy = require('busboy');
    StreamUpload = require('stream_upload');
    
exports.eejsBlock_editbarMenuLeft = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_insert_media/templates/editbarButtons.ejs", {}, module);
  return cb();
}

exports.eejsBlock_body = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_insert_media/templates/modals.ejs", {}, module);
  return cb();
}

exports.eejsBlock_scripts = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_insert_media/templates/scripts.ejs", {}, module);
  return cb();
}

exports.eejsBlock_styles = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_insert_media/templates/styles.ejs", {}, module);
  return cb();
}

exports.expressConfigure = function (hookName, context) {
  context.app.post('/p/:padId/pluginfw/ep_insert_media/upload', function (req, res, next) {
    console.log('expressConfigure POST PARAMS', req.params);

  })
}