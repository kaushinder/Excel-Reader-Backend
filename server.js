// server.js
const mongoose = require("mongoose");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const config = require("./app.config");

const { CONNECTION_STRING } = config;

const cors = require("cors");

require("dotenv/config");

const port = process.env.PORT || 8000;

const startServer = () => {
  mongoose
    .connect(CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "excelFileReader",
    })
    .then(() => {
      console.log("Database connection is ready");

      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// middleware
app.use(cors());
app.options("*", cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(morgan("tiny"));

// routers

require("./route/fileUpload")(app);

// Start the server

startServer();
