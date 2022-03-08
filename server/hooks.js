'use strict';

const eejs = require('ep_etherpad-lite/node/eejs');
const busboy = require('busboy');
const path = require('path');
const settings = require('ep_etherpad-lite/node/utils/Settings');
const AWS = require('aws-sdk');
const mime = require('mime-types');
const fileHandlers = require('./handlers/fileHandlers');
const uuid = require('uuid');

exports.eejsBlock_editbarMenuLeft = (_hookName, args) => {
  args.content += eejs.require('ep_insert_media/templates/editbarButtons.ejs', {}, module);
  return [];
};

exports.eejsBlock_body = (_hookName, args) => {
  args.content += eejs.require('ep_insert_media/templates/modals.ejs', {}, module);
  return [];
};

exports.eejsBlock_scripts = (_hookName, args) => {
  args.content += eejs.require('ep_insert_media/templates/scripts.ejs', {}, module);
  return [];
};

exports.eejsBlock_styles = (_hookName, args) => {
  args.content += eejs.require('ep_insert_media/templates/styles.ejs', {}, module);
  return [];
};


exports.expressConfigure = (_hookName, context) => {
  context.app.get('/p/getImage/:padId/:mediaId', (req, res) => {
    const s3 = new AWS.S3({
      accessKeyId: settings.ep_insert_media.s3Storage.accessKeyId,
      secretAccessKey: settings.ep_insert_media.s3Storage.secretAccessKey,
      endpoint: settings.ep_insert_media.s3Storage.endPoint,
      s3ForcePathStyle: true, // needed with minio?
      signatureVersion: 'v4',
    });
    try {
      const params = {Bucket: settings.ep_insert_media.s3Storage.bucket, Key: `${req.params.padId}/${req.params.mediaId}`};
      s3.getObject(params, (err, data) => {
        if (data) {
          res.writeHead(200, {'Content-Type': 'image/jpeg'});
          res.write(data.Body, 'binary');
          res.end(null, 'binary');
        } else {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.write(JSON.stringify(err.message));
          res.end();
        }
      });
    } catch (error) {
      console.error('error', error.message);
    }
  });

  context.app.get('/p/getVideo/:padId/:mediaId', (req, res) => {
    const s3 = new AWS.S3({
      accessKeyId: settings.ep_insert_media.s3Storage.accessKeyId,
      secretAccessKey: settings.ep_insert_media.s3Storage.secretAccessKey,
      endpoint: settings.ep_insert_media.s3Storage.endPoint,
      s3ForcePathStyle: true, // needed with minio?
      signatureVersion: 'v4',
    });
    try {
      const params = {Bucket: settings.ep_insert_media.s3Storage.bucket, Key: `${req.params.padId}/${req.params.mediaId}`};
      s3.getObject(params, (err, data) => {
        if (data) {
          res.writeHead(200, {'Content-Type': 'video/mp4'});
          res.write(data.Body, 'binary');
          res.end(null, 'binary');
        } else {
          res.write(err, 'binary');

          res.end(null, 'binary');
        }
      });
    } catch (error) {
      console.error('error', error);
    }
  });


  context.app.get('/p/getMedia/:padId/:mediaId', (req, res) => {
    const s3 = new AWS.S3({
      accessKeyId: settings.ep_insert_media.s3Storage.accessKeyId,
      secretAccessKey: settings.ep_insert_media.s3Storage.secretAccessKey,
      endpoint: settings.ep_insert_media.s3Storage.endPoint,
      s3ForcePathStyle: true, // needed with minio?
      signatureVersion: 'v4',
    });
    try {
      const params = {Bucket: settings.ep_insert_media.s3Storage.bucket, Key: `${req.params.padId}/${req.params.mediaId}`};
      s3.getObject(params, (err, data) => {
        if (data) {
          res.writeHead(200, {'Content-Type': mime.lookup(req.params.mediaId)});
          res.write(data.Body, 'binary');
          res.end(null, 'binary');
        } else {
          res.write(err, 'binary');

          res.end(null, 'binary');
        }
      });
    } catch (error) {
      console.error('error', error);
    }
  });

  context.app.post('/p/:padId/pluginfw/ep_insert_media/upload', (req, res, next) => {
    const padId = req.params.padId;
    const storageConfig = settings.ep_insert_media;
    if (!storageConfig) return;

    const bb = busboy({headers: req.headers, limits: {
      fileSize: settings.ep_insert_media.maxFileSize,
    }});

    let uploadResult;
    let finished;

    bb.on('file', async (name, file, info) => {
      const {filename, mimeType} = info;
      const newFileName = uuid.v4();
      const fileType = path.extname(filename);
      const savedFilename = path.join(padId, newFileName + fileType);

      if (settings.ep_insert_media.localStorage) {
        uploadResult = await fileHandlers.localUploadMedia(file, mimeType, savedFilename, fileType);
        if (finished) {
          res.status(201).json(uploadResult);
          res.end();
        }
      }
      if (settings.ep_insert_media.s3Storage) {
        fileHandlers.s3UploadMedia(file, savedFilename, fileType, (err, data) => {
          if (err) console.error(err, err.stack, 'error');
          if (data) {
            res.status(201).json({type: 's3', error: false, fileName: savedFilename, fileType, data});
            res.end();
          } else {
            res.status(400).json({type: 's3', error: true, fileName: savedFilename, fileType, data});
            res.end();
          }
        });
      }
    });

    bb.on('close', () => {
      finished = true; // related to localStorage
    });

    return req.pipe(bb);
  });
};
