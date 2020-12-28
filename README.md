
# Insert media plugin
It will upload / add media ( audio / video / stream / youtube / vimeo ) to pad.

## Demo
![](https://youtu.be/0zi4EGQdZyE)

## Installing
npm install ep_insert_media

or Use the Etherpad ``/admin`` interface.

## Settings
    "ep_insert_media":{
      "storage":{
        "endPoint" : "${BUCKET_S3_SERVER:null}",
        "useSSL" : true ,
        "type": "s3",
        "accessKeyId": "${ACCESS_KEY_ID:null}",
        "secretAccessKey": "${ACCESS_KEY_SECRET:null}",
        "region": "UK",
        "bucket": "${MEDIA_BUCKET_NAME}",
        "baseFolder": "${FOLDER_PATH:./}"
      },
      "fileTypes": ["jpeg", "jpg", "bmp", "gif","png","webm","mp4","m4v","mp3",
        "ogg", "m4a","flac","wav","wma", "aac"  ],
      "maxFileSize": 50000000
    },

## LICENSE
Apache 2.0
