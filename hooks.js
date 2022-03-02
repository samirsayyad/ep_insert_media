'use strict';

const path = require('path');
const eejs = require('ep_etherpad-lite/node/eejs');
const Busboy = require('busboy');
const StreamUpload = require('stream_upload');
const uuid = require('uuid');
const url = require('url');
const settings = require('ep_etherpad-lite/node/utils/Settings');
const AWS = require('aws-sdk');
const mime = require('mime-types');
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
      accessKeyId: settings.ep_insert_media.storage.accessKeyId,
      secretAccessKey: settings.ep_insert_media.storage.secretAccessKey,
      endpoint: settings.ep_insert_media.storage.endPoint,
      s3ForcePathStyle: true, // needed with minio?
      signatureVersion: 'v4',
    });
    try {
      const params = {Bucket: settings.ep_insert_media.storage.bucket, Key: `${req.params.padId}/${req.params.mediaId}`};
      s3.getObject(params, (err, data) => {
        if (data) {
          res.writeHead(200, {'Content-Type': 'image/jpeg'});
          res.write(data.Body, 'binary');
          res.end(null, 'binary');
        } else {
          res.write(err, 'binary');

          res.end(null, 'binary');
        }
      });
    } catch (error) {
      console.log('error', error);
    }
  });

  context.app.get('/p/getVideo/:padId/:mediaId', (req, res) => {
    const s3 = new AWS.S3({
      accessKeyId: settings.ep_insert_media.storage.accessKeyId,
      secretAccessKey: settings.ep_insert_media.storage.secretAccessKey,
      endpoint: settings.ep_insert_media.storage.endPoint,
      s3ForcePathStyle: true, // needed with minio?
      signatureVersion: 'v4',
    });
    try {
      const params = {Bucket: settings.ep_insert_media.storage.bucket, Key: `${req.params.padId}/${req.params.mediaId}`};
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
      console.log('error', error);
    }
  });


  context.app.get('/p/getMedia/:padId/:mediaId', (req, res) => {
    const s3 = new AWS.S3({
      accessKeyId: settings.ep_insert_media.storage.accessKeyId,
      secretAccessKey: settings.ep_insert_media.storage.secretAccessKey,
      endpoint: settings.ep_insert_media.storage.endPoint,
      s3ForcePathStyle: true, // needed with minio?
      signatureVersion: 'v4',
    });
    try {
      const params = {Bucket: settings.ep_insert_media.storage.bucket, Key: `${req.params.padId}/${req.params.mediaId}`};
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
      console.log('error', error);
    }
  });

  context.app.post('/p/:padId/pluginfw/ep_insert_media/upload', (req, res, next) => {
    try {
      const padId = req.params.padId;
      const storageConfig = settings.ep_insert_media.storage;
      let msgError = null;
      if (!storageConfig) return;
      const s3UploadMedia = (file, savedFilename, fileType) => {
        const s3 = new AWS.S3({
          accessKeyId: settings.ep_insert_media.storage.accessKeyId,
          secretAccessKey: settings.ep_insert_media.storage.secretAccessKey,
          endpoint: settings.ep_insert_media.storage.endPoint,
          s3ForcePathStyle: true, // needed with minio?
          signatureVersion: 'v4',
        });
        const paramsUpload = {
          bucket: settings.ep_insert_media.storage.bucket,
          Bucket: settings.ep_insert_media.storage.bucket,
          Key: savedFilename, // File name you want to save as in S3
          Body: file,
        };
        s3.upload(paramsUpload, (err, data) => {
          if (err) console.log(err, err.stack, 'error');

          if (data) {
            return res.status(201).json({type: settings.ep_insert_media.storage.type, error: false, fileName: savedFilename, fileType, data});
          } else {
            msgError = err.stack.substring(0, err.stack.indexOf('\n'));
          }
        });
      };
      const localUploadMedia = (file, mimetype, savedFilename, accessPath, fileType, busboy, done) => {
        const imageUpload = new StreamUpload({
          extensions: settings.ep_insert_media.fileTypes,
          maxSize: settings.ep_insert_media.maxFileSize,
          baseFolder: settings.ep_insert_media.storage.baseFolder,
          storage: settings.ep_insert_media.storage,
        });
        const uploadResult = imageUpload.upload(file, {type: mimetype, filename: savedFilename});
        busboy.on('error', done);
        busboy.on('finish', () => {
          if (uploadResult) {
            uploadResult
                .then((data) => {
                  if (accessPath) data = accessPath;
                  return res.status(201).json({type: settings.ep_insert_media.storage.type, error: false, fileName: data, fileType});
                })
                .catch((err) => {
                  msgError = err.stack;
                });
          }
        });
      };
      const createStreamMedia = () => {
        const busboy = new Busboy({
          headers: req.headers,
          limits: {
            fileSize: settings.ep_insert_media.maxFileSize,
          },
        });
        let isDone;
        const done = (error) => {
          if (error) {
            console.log('ep_insert_media UPLOAD ERROR', error);
            return;
          }
          if (isDone) return;
          isDone = true;
          req.unpipe(busboy);
          busboy.removeAllListeners();
          msgError = error.stack.substring(0, error.stack.indexOf('\n'));
        };

        const newFileName = uuid.v4();
        let accessPath;
        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
          const fileType = path.extname(filename);
          let savedFilename = path.join(padId, newFileName + fileType);
          if (storageConfig && settings.ep_insert_media.storage.type === 'local') {
            let baseURL = settings.ep_insert_media.storage.baseURL;
            if (baseURL.charAt(baseURL.length - 1) !== '/') {
              baseURL += '/';
            }
            accessPath = url.resolve(settings.ep_insert_media.storage.baseURL, savedFilename);
            savedFilename = path.join(settings.ep_insert_media.storage.baseFolder, savedFilename);
          }
          file.on('limit', () => {
            msgError = 'File is too large';
          });
          file.on('error', (error) => {
            busboy.emit('error', error);
          });


          (settings.ep_insert_media.storage.type === 's3')
            ? s3UploadMedia(file, savedFilename, fileType) : localUploadMedia(file, mimetype, savedFilename, accessPath, fileType, busboy, done);

          if (msgError != null) { return res.status(201).json({error: msgError}); }

          req.pipe(busboy);
        });
      };

      createStreamMedia();
      return context;
    } catch (e) {
      console.error(e);
      return e;
    }
  });
};
