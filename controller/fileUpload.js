var XLSX = require("xlsx");
var multer = require("multer");

const { promisify } = require("util");
const config = require("../app.config");
const fileUpload = require("../model/fileUpload");

//saves file in temp dir
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload = multer({
  storage: storage,
}).single("file");

// read  file from temp dir

exports.fileRead = async (req, res) => {
  try {
    const uploadPromise = promisify(upload);
    await uploadPromise(req, res);
    console.log(req, "Req log");

    var filename = req.file?.filename;
    console.log(filename, "filenme");
    if (!filename) {
      throw new Error("Invalid file name");
    }

    await createEntry(req.file.path, filename, res);
  } catch (err) {
    res.status(500).send({
      status: true,
      message: err.message,
    });
  }
};

//creating an entry
async function createEntry(path, filename, res) {
  try {
    var read = await XLSX.readFile(path);
    var sheet_name_list = read.SheetNames;
    let rows = XLSX.utils.sheet_to_row_object_array(
      read.Sheets[sheet_name_list[0]],
      {
        header: 1,
      }
    );

    const jsonData = [];

    // Iterate over each row (starting from index 1)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // Skip empty rows
      if (row.length === 0) {
        continue;
      }

      const rowData = {};

      // Iterate over each column and create key-value pairs in rowData object
      for (let j = 0; j < rows[0].length; j++) {
        const columnName = rows[0][j];
        const cellValue = row[j];

        // Mark the column as invalid if the cell value is empty
        if (!cellValue) {
          rowData[columnName] = "invalid";
          rowData.hasInvalidFields = true;
        } else {
          rowData[columnName] = cellValue;
        }
      }

      // Add the row rows to the JSON array
      jsonData.push(rowData);
    }

    for (let i = 0; i < jsonData.length; i++) {
      const data = jsonData[i];

      // Skip rows with hasInvalidFields set to true
      if (data.hasInvalidFields) {
        continue;
      }

      // Create a new document using the FileUpload model
      const fileUploadFun = new fileUpload({
        companyName: data["College Name"],
        university: data["University"],
        email: data["Email"],
      });

      // Save the document to the MongoDB table
      await fileUploadFun.save();
    }

    console.log("Data inserted successfully");

    res.status(200).send({
      status: true,
      data: [{ filename, excelData: jsonData }],

      message: "Data entered created successfully",
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send({
      status: false,
      message: "An error occurred while processing the file",
    });
  }
}
