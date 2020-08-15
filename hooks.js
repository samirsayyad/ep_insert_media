var path = require('path'), 
    eejs = require("ep_etherpad-lite/node/eejs");
    Busboy = require('busboy');
    StreamUpload = require('stream_upload');
    uuid = require('uuid');
    path = require('path');
    mimetypes = require('mime-db');
    url = require('url');
    settings = require('ep_etherpad-lite/node/utils/Settings');
    Minio = require('minio');
    AWS = require('aws-sdk');
    
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

exports.expressConfigure = async function (hookName, context) {
  context.app.get('/p/:padId/getImage/:mediaId', function (req, res, next) {
    var s3  = new AWS.S3({
        accessKeyId: settings.ep_insert_media.storage.accessKeyId,
        secretAccessKey: settings.ep_insert_media.storage.secretAccessKey,
        endpoint: settings.ep_insert_media.storage.endPoint, 
        s3ForcePathStyle: true, // needed with minio?
        signatureVersion: 'v4'
    });
    var params = { Bucket: settings.ep_insert_media.storage.bucket, Key: `${req.params.padId}/${req.params.mediaId}`  };
    s3.getObject(params, function(err, data) {
        res.writeHead(200, {'Content-Type': 'image/jpeg'});
        res.write(data.Body, 'binary');
        res.end(null, 'binary');
    });
  })
  context.app.get('/p/:padId/getVideo/:mediaId', function (req, res, next) {
    var s3  = new AWS.S3({
        accessKeyId: settings.ep_insert_media.storage.accessKeyId,
        secretAccessKey: settings.ep_insert_media.storage.secretAccessKey,
        endpoint: settings.ep_insert_media.storage.endPoint, 
        s3ForcePathStyle: true, // needed with minio?
        signatureVersion: 'v4'
    });
    var params = { Bucket: settings.ep_insert_media.storage.bucket, Key: `${req.params.padId}/${req.params.mediaId}`  };
    s3.getObject(params, function(err, data) {
        res.writeHead(200, {'Content-Type': 'video/mp4'});
        res.write(data.Body, 'binary');
        res.end(null, 'binary');
    });
  })

  context.app.post('/p/:padId/pluginfw/ep_insert_media/upload', function (req, res, next) {
    console.log(settings.ep_insert_media)
    var padId = req.params.padId;
    var storageConfig = settings.ep_insert_media.storage;

    if (settings.ep_insert_media.storage.type =="s3"){
  
        var s3  = new AWS.S3({
            accessKeyId: settings.ep_insert_media.storage.accessKeyId,
            secretAccessKey: settings.ep_insert_media.storage.secretAccessKey,
            endpoint: settings.ep_insert_media.storage.endPoint, 
            s3ForcePathStyle: true, // needed with minio?
            signatureVersion: 'v4'
        });
 
    }else{
        var imageUpload = new StreamUpload({
            extensions: settings.ep_insert_media.fileTypes,
            maxSize: settings.ep_insert_media.maxFileSize,
            baseFolder: settings.ep_insert_media.storage.baseFolder,
            storage: settings.ep_insert_media.storage
          });
  
          
    }

    if (storageConfig) {
        try {
            var busboy = new Busboy({
                headers: req.headers,
                limits: {
                    fileSize: settings.ep_insert_media.maxFileSize
                }
            });
        } catch (error) {
            console.error('ep_insert_media ERROR', error);

            return next(error);
        }
        var isDone;
        var done = function (error) {
            if (error) {
                console.error('ep_insert_media UPLOAD ERROR', error);
                return;
            }
            if (isDone) return;
            isDone = true;
            res.status(error.statusCode || 500).json(error);
            req.unpipe(busboy);
            drainStream(req);
            busboy.removeAllListeners();
        };

        var uploadResult;
        var newFileName = uuid.v4();
        var accessPath = '';
        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
            var savedFilename = path.join(padId, newFileName + path.extname(filename));

            if (storageConfig && settings.ep_insert_media.storage.type === 'local') {
                var baseURL = settings.ep_insert_media.storage.baseURL;
                if (baseURL.charAt(baseURL.length - 1) !== '/') {
                    baseURL += '/';
                }
                accessPath = url.resolve(settings.ep_insert_media.storage.baseURL, savedFilename);
                savedFilename = path.join(settings.ep_insert_media.storage.baseFolder, savedFilename);
            }
            file.on('limit', function () {
                var error = new Error('File is too large');
                error.type = 'fileSize';
                error.statusCode = 403;
                busboy.emit('error', error);
                imageUpload.deletePartials();
            });
            file.on('error', function (error) {
                busboy.emit('error', error);
            });

            var fileType = path.extname(savedFilename)

            if (settings.ep_insert_media.storage.type =="s3"){
                var params_upload = {
                    bucket: settings.ep_insert_media.storage.bucket,
                    Bucket: settings.ep_insert_media.storage.bucket,
                    Key: savedFilename, // File name you want to save as in S3
                    Body: file
                };
                s3.upload(params_upload, function(err, data) {
                    if (err)
                     console.log(err, err.stack,"error")
                    else   
                     console.log("Successfully uploaded data to testbucket/testobject");

                    if (data){
                        return res.status(201).json({"error":false,fileName :savedFilename ,fileType:fileType})
                    }else{
                        return res.status(201).json({"error":err.stack})
                    }
                    
                });


            }else{

                uploadResult = imageUpload
                .upload(file, {type: mimetype, filename: savedFilename});
                busboy.on('error', done);
                busboy.on('finish', function () {
                if (uploadResult) {
                    uploadResult
                        .then(function (data) {
    
                            if (accessPath) {
                                data = accessPath;
                            }
    
                            return res.status(201).json({"error":false,fileName : data, fileType:fileType});
                        })
                        .catch(function (err) {
                            return res.status(500).json({"error":err.stack});
                        });
                }
    
            });
            }

        });

       
        req.pipe(busboy);
    }












        
        

  })
}