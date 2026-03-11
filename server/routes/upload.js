const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    var ext = path.extname(file.originalname);
    var name = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    cb(null, name);
  }
});

var fileFilter = function (req, file, cb) {
  var allowed = /jpeg|jpg|png|gif|webp/;
  var ext = allowed.test(path.extname(file.originalname).toLowerCase());
  var mime = allowed.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件（jpg/png/gif/webp）'));
  }
};

var upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/', auth, upload.single('file'), function (req, res) {
  try {
    if (!req.file) {
      return error(res, '请选择要上传的图片');
    }
    var url = '/uploads/' + req.file.filename;
    return success(res, { url: url, filename: req.file.filename }, '上传成功');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.post('/multiple', auth, upload.array('files', 9), function (req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return error(res, '请选择要上传的图片');
    }
    var urls = req.files.map(function (f) {
      return '/uploads/' + f.filename;
    });
    return success(res, { urls: urls }, '上传成功');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
