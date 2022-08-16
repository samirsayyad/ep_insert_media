const eejs = require('ep_etherpad-lite/node/eejs');
const settings = require('ep_etherpad-lite/node/utils/Settings');
const path = require('path');
const mime = require('mime');
const uuid = require('uuid');
const fileUpload = require('express-fileupload');
const {extractFileType} = require('./fileType');

const localStorage = require('./storage.local');
const AWSS3Storage = require('./storage.AWS.S3');

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
  const {maxFileSize, s3Storage, persistToLocal = false} = settings.ep_insert_media;

  const TWO_MEG = 2 * 1024 * 1024;
  const MAX_UPLOAD_SIZE = maxFileSize || TWO_MEG;

  // import the express-fileupload middleware
  context.app.use(fileUpload({
    createParentPath: true,
    limits: {fileSize: MAX_UPLOAD_SIZE},
    tempFileDir: './temp/ep_insert_media',
    parseNested: true,
  }));

  // controller
  const responseMedia = async (req, res) => {
    const {padId, mediaId} = req.params;
    if (persistToLocal) {
      return res.sendFile(path.join(process.cwd(), `./temp/ep_insert_media/${padId}/${mediaId}`));
    }
    return AWSS3Storage.get(padId, mediaId, res)
        .catch((err) => {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.write(JSON.stringify(err.message));
          res.end();
        });
  };

  context.app.get('/pluginfw/ep_insert_media/media/:padId/:mediaId', responseMedia);

  context.app.post('/pluginfw/ep_insert_media/mdeia/:padId', async (req, res, next) => {
    const padId = req.params.padId;
    const storageConfig = settings.ep_insert_media;
    const files = req.files;
    const mediaFile = files?.mediaFile;
    const canPersist2Local = storageConfig.persistToLocal || false;

    if (!storageConfig) return;
    if (!mediaFile) return res.status(400).send('No files were uploaded.');

    // if "persistToLocal" set true,   save the media to current directory
    if (canPersist2Local) {
      const uploadResult = await localStorage.upload(padId, mediaFile)
          .catch((err) => {
            console.error(err);
            return res.status(400).send('No files were uploaded.');
          });

      res.status(201).json(uploadResult);
      return res.end();
    }

    // if s3 storage config available
    if (s3Storage) {
      const format = mime.getExtension(mediaFile.mimetype);
      const fileName = `${uuid.v4()}.${format}`;
      const fileType = extractFileType(format);

      const data = await AWSS3Storage.upload(padId, fileName, mediaFile.data)
          .catch((err) => {
            console.error('AWS.S3 router:', err);
            return res.status(400).send('No files were uploaded.');
          });

      const result = {type: 's3', error: true, fileType, fileName, data: mediaFile.data};

      if (!data) {
        return res.status(400).json(result);
      }

      return res.status(201).json({...result, error: false});
    }

    return req.send(true);
  });
};
