'use strict';

const StreamUpload = require('stream_upload');
const url = require('url');
const settings = require('ep_etherpad-lite/node/utils/Settings');
const AWS = require('aws-sdk');
const path = require('path');

const s3UploadMedia = async (file, savedFilename, fileType) => {
  const s3 = new AWS.S3({
    accessKeyId: settings.ep_insert_media.s3Storage.accessKeyId,
    secretAccessKey: settings.ep_insert_media.s3Storage.secretAccessKey,
    endpoint: settings.ep_insert_media.s3Storage.endPoint,
    s3ForcePathStyle: true, // needed with minio?
    signatureVersion: 'v4',
  });
  const paramsUpload = {
    bucket: settings.ep_insert_media.s3Storage.bucket,
    Bucket: settings.ep_insert_media.s3Storage.bucket,
    Key: savedFilename, // File name you want to save as in S3
    Body: file,
  };
  const uploadResult = await s3.upload(paramsUpload);
  return {type: 's3', error: false, fileName: savedFilename, fileType, data: uploadResult};

  // s3.upload(paramsUpload, (err, data) => {
  //   if (err) console.log(err, err.stack, 'error');

  //   if (data) {
  //     return {type: settings.ep_insert_media.s3Storage.type, error: false, fileName: savedFilename, fileType, data};
  //   } else {
  //     return err.stack.substring(0, err.stack.indexOf('\n'));
  //   }
  // });
};

const localUploadMedia = async (file, mimetype, savedFilename, fileType, busboy, done) => {
  try {
    const imageUpload = new StreamUpload({
      extensions: settings.ep_insert_media.fileTypes,
      maxSize: settings.ep_insert_media.maxFileSize,
      baseFolder: settings.ep_insert_media.localStorage.baseFolder,
      storage: settings.ep_insert_media.localStorage,
    });

    let baseURL = settings.ep_insert_media.localStorage.baseURL;
    if (baseURL.charAt(baseURL.length - 1) !== '/') {
      baseURL += '/';
    }
    const accessPath = url.resolve(settings.ep_insert_media.localStorage.baseURL, savedFilename);
    const finalSavedFilename = path.join(settings.ep_insert_media.localStorage.baseFolder, savedFilename);
    const uploadResult = await imageUpload.upload(file, {type: mimetype, filename: finalSavedFilename});
    if (uploadResult) { return {type: 'localStorage', error: false, fileName: accessPath, fileType}; } else { return null; }
  } catch (e) {
    console.log(e);
  }

  // busboy.on('error', done);
  // busboy.on('finish', () => {
  //   if (uploadResult) {
  //     uploadResult
  //         .then((data) => {
  //           if (accessPath) data = accessPath;
  //           return {type: settings.ep_insert_media.storage.type, error: false, fileName: data, fileType};
  //         })
  //         .catch((err) => {
  //           err.stack;
  //         });
  //   }
  // });
};
module.exports = {localUploadMedia,
  s3UploadMedia};
