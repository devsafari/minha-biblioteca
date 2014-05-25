var easyimg    = require('easyimage'),
    path       = require("path"),
    baseUpload = path.join(global.app.rootDir, 'public','html', 'uploads'),
    uploadDir  = path.join(baseUpload,'original'),
    fileupload = require('fileupload').createFileUpload(uploadDir),
    mkdirp     = require('mkdirp');

module.exports = {
  upload: function(src,callback) {
    fileupload.put(src, function(error, file) {
      var uploadedFilePath     = path.join(uploadDir, file.path),
          uploadedFileFullPath = path.join(uploadedFilePath, file.basename);

      callback.call(null, error, {file: file, file_dest: uploadedFileFullPath, uploadDir: baseUpload });

    })
  },
  thumb: function(src,destpath, destfilename,callback) {
    mkdirp.sync(destpath);

    easyimg.thumbnail({
      src: src, 
      dst: path.join(destpath, destfilename),
      width:128, 
      height:128,
      x:0, 
      y:0
    },
    function(err, image) {
      callback.call(null,err,image);
    });
  },
  uploadAndCreateThumb: function(src,callback) {
    var self = this;
    self.upload(src, function(err,f) {
      var dest_path = path.join(f.uploadDir, 'thumb', f.file.path);
      var file      = f;

      self.thumb(f.file_dest,dest_path, f.file.basename, function(err, image) {      
        callback.call(null, err, file);
      })
    })
  }
}