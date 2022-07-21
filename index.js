const express = require("express");
const upload = require("express-fileupload");
const cors = require("cors");
const path = require("path");
const mysql = require("mysql2");
const app = express();
const fs = require("fs");

app.use(upload());

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "aditya6838",
  database: "react-node-file-upload-system",
});

// app.use(
//   cors({
//     origin: ["http://localhost:3000"],
//     methods: ["GET", "POST"],
//     credentials: true,
//   })
// );

app.use(cors());

app.use(express.static("uploads"));

app.delete("/media/images", (req, res) => {
  const filename = req.query.filename;

  const path = `${__dirname}/uploads/images/${filename}`;

  fs.unlink(path, (err) => {
    if (err) {
      console.error(err);
      return;
    }

    //file removed
  });

  const sqlInsert = `DELETE FROM uploads WHERE filename = ?`;
  db.query(sqlInsert, filename, (err, result) => {
    if (err) res.send({ error: err });

    db.query("Select * from uploads", (err2, result2) => {
      if (err2) res.send({ error: err2 });
      res.send({ success: true, data: result2 });
    });
  });
});

app.get("/media/images", (req, res) => {
  const sqlInsert = "Select * from uploads";
  db.query(sqlInsert, (err, result) => {
    if (err) res.send({ error: err });
    res.send({ success: true, data: result });
  });
});

app.post("/upload", async (req, res) => {
  if (!req.files) {
    return res.send({
      success: false,
      message: "No image uploaded!",
    });
  }

  const data = [];

  function move(file) {
    try {
      console.log(file.mimetype.split("/")[0]);

      switch (file.mimetype.split("/")[0]) {
        case "image":
          const alterFileName = Date.now() + path.extname(file.name);

          file.mv("uploads/images/" + alterFileName);

          const sqlInsert =
            "INSERT INTO uploads (originalname, filename, filetype) VALUES (?,?,?)";

          db.query(
            sqlInsert,
            [file.name, alterFileName, file.mimetype.split("/")[0]],
            (err, result) => {
              if (err) res.send({ error: err });
              console.log(result);
            }
          );

          break;
        case "video":
          file.mv("uploads/videos/" + file.name);
          break;

        default:
          res.send({ error: "Invalid file type" }).status(500);
      }
    } catch (e) {
      return res.send({
        success: false,
        message: "error moving image",
      });
    }

    data.push({
      name: file.name,
      mimeType: file.mimetype,
      size: file.size,
    });
  }

  const file = req.files.file;

  if (Array.isArray(file)) {
    file.forEach((file) => move(file));
  } else {
    move(file);
  }

  return res.status(200).send({ success: true });
});

app.listen(3001, () => console.log("server started"));
