const settings = require('ep_etherpad-lite/node/utils/Settings');
const AWS = require('aws-sdk');
const {extractFileType} = require('../fileType');


const mime = require('mime');

const s3UploadMedia = (file, savedFilename, callback) => new Promise((resolve, reject) => {
  const {
    accessKeyId,
    secretAccessKey,
    endPoint,
    bucket,
  } = settings.ep_insert_media.s3Storage;

  const s3 = new AWS.S3({
    accessKeyId,
    secretAccessKey,
    endpoint: endPoint,
    s3ForcePathStyle: true, // needed with minio?
    signatureVersion: 'v4',
  });
  const paramsUpload = {
    bucket,
    Bucket: bucket,
    Key: savedFilename, // File name you want to save as in S3
    Body: file,
  };
  s3.upload(paramsUpload, resolve);
});

// use this function just for development pepose
const localUploadMedia = async (file) => {
  try {
    const format = mime.getExtension(file.mimetype);
    const path = `${file.tempFilePath}.${format}`;
    const fileType = extractFileType(format);
    // save file
    await file.mv(path);
    const result = {type: 'localStorage', error: false, fileName: path.split('/').pop(), fileType};
    return result;
  } catch (e) {
    console.error('[ep_insert_media]: localUploadMedia', e);
  }
};
module.exports = {
  localUploadMedia,
  s3UploadMedia,

};
