const eejs = require('ep_etherpad-lite/node/eejs');
const busboy = require('busboy');
const path = require('path');
const settings = require('ep_etherpad-lite/node/utils/Settings');
const AWS = require('aws-sdk');
const mime = require('mime-types');
const fileHandlers = require('./handlers/fileHandlers');
const uuid = require('uuid');
const fileUpload = require('express-fileupload');

exports.clientVars = (hook, context, callback) => ({
  ep_insert_media: {
    settings: settings.ep_insert_media,
  },
});

exports.eejsBlock_editbarMenuLeft = (_hookName, args) => {
  args.content += eejs.require('ep_insert_media/templates/editbarButtons.ejs', {}, module);
  return [];
};

exports.eejsBlock_body = (_hookName, args) => {
  args.content += eejs.require('ep_insert_media/templates/modals.ejs', {}, module);
  return [];
};


exports.eejsBlock_styles = (_hookName, args) => {
  args.content += eejs.require('ep_insert_media/templates/styles.ejs', {}, module);
  return [];
};


exports.expressConfigure = (_hookName, context) => {
  const {maxFileSize, s3Storage} = settings.ep_insert_media;

  const TWO_MEG = 2 * 1024 * 1024;
  const MAX_UPLOAD_SIZE = maxFileSize || TWO_MEG;

  context.app.use(fileUpload({
    createParentPath: true,
    limits: {fileSize: MAX_UPLOAD_SIZE},
    useTempFiles: true,
    tempFileDir: './temp/ep_insert_media',
    parseNested: true,
  }));

  context.app.get('/p/getImage/:padId/:mediaId', (req, res) => {
    const s3 = new AWS.S3({
      accessKeyId: s3Storage.accessKeyId,
      secretAccessKey: s3Storage.secretAccessKey,
      endpoint: s3Storage.endPoint,
      s3ForcePathStyle: true, // needed with minio?
      signatureVersion: 'v4',
    });
    try {
      const params = {
        Bucket: s3Storage.bucket,
        Key: `${req.params.padId}/${req.params.mediaId}`,
      };
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
      accessKeyId: s3Storage.accessKeyId,
      secretAccessKey: s3Storage.secretAccessKey,
      endpoint: s3Storage.endPoint,
      s3ForcePathStyle: true, // needed with minio?
      signatureVersion: 'v4',
    });
    try {
      const params = {
        Bucket: s3Storage.bucket,
        Key: `${req.params.padId}/${req.params.mediaId}`,
      };
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
      accessKeyId: s3Storage.accessKeyId,
      secretAccessKey: s3Storage.secretAccessKey,
      endpoint: s3Storage.endPoint,
      s3ForcePathStyle: true, // needed with minio?
      signatureVersion: 'v4',
    });
    try {
      const params = {
        Bucket: s3Storage.bucket,
        Key: `${req.params.padId}/${req.params.mediaId}`,
      };
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

  context.app.get('/pluginfw/ep_insert_media/media/:address', async (req, res, next) => {
    const {address} = req.params;
    res.sendFile(path.join(process.cwd(), `./temp/ep_insert_media/${address}`));
  });

  context.app.post('/p/:padId/pluginfw/ep_insert_media/upload', async (req, res, next) => {
    const padId = req.params.padId;
    const storageConfig = settings.ep_insert_media;
    const files = req.files;
    const mediaFile = files?.mediaFile;
    const canPersist2Local = storageConfig.persistToLocal || false;

    if (!storageConfig) return;
    if (!mediaFile) return res.status(400).send('No files were uploaded.');

    // if "persistToLocal" set true, save the media to current directory
    if (canPersist2Local) {
      const uploadResult = await fileHandlers.localUploadMedia(mediaFile);
      res.status(201).json(uploadResult);
      return res.end();
    }
    // if s3 storage config available
    if (s3Storage) {
      const newFileName = uuid.v4();
      const fileType = path.extname(mediaFile.name);
      const savedFilename = path.join(padId, newFileName + fileType);
      const {err, data} = await fileHandlers.s3UploadMedia(mediaFile.data, savedFilename, fileType);

      if (err) console.error(err, err.stack, 'error');

      if (!data) {
        res.status(400).json({
          type: 's3', error: true, fileName: savedFilename, fileType, data,
        });
        return res.end();
      }

      res.status(201).json({
        type: 's3', error: false, fileName: savedFilename, fileType, data,
      });
      return res.end();
    }
    return req.send(true);
  });
};
