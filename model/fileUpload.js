const mongoose = require("mongoose");

const fileUploadSchema = mongoose.Schema({
  companyName: String,
  university: String,
  email: String,
});

module.exports = mongoose.model("fileUpload", fileUploadSchema);
