const mime = require('mime');
const {extractFileType} = require('./fileType');
const uuid = require('uuid');


exports.upload = async (padId, file) => {
  try {
    const format = mime.getExtension(file.mimetype);

    const path = `./temp/ep_insert_media/${padId}/${uuid.v4()}.${format}`;
    const fileType = extractFileType(format);
    // save file
    await file.mv(path);
    const result = {type: 'localStorage', error: false, fileName: path.split('/').pop(), fileType};
    return result;
  } catch (e) {
    console.error('[ep_insert_media]: localUploadMedia', e);
  }
};
