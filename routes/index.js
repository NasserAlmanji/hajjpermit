var express = require("express");
var router = express.Router();
const multer = require("multer");
const pdf = require("pdf-parse");
const fs = require("fs");
const path = require("path");

const upload = multer({ dest: "uploads/" });

router.get("/upload", function (req, res, next) {
  res.render("upload", { title: "Express" });
});

router.get("/", function (req, res, next) {
  res.render("download", { title: "Express" });
});

// Hajj Messages of the Day (in Arabic)
const HAJJ_MESSAGES = [
  "من حج فلم يرفث ولم يفسق رجع كيوم ولدته أمه",
  "اللهم اجعله حجاً مبروراً وذنباً مغفوراً وسعياً مشكوراً",
  "الحجاج والعمار وفد الله، إن دعوه أجابهم وإن استغفروه غفر لهم",
  "خير الدعاء دعاء يوم عرفة",
  "طوافك بالبيت صلاة إلا أن الله أحل فيه الكلام",
  "اللهم أرزقنا حج بيتك الحرام",
];

router.get("/motd", (req, res) => {
  const randomMessage =
    HAJJ_MESSAGES[Math.floor(Math.random() * HAJJ_MESSAGES.length)];
  res.json({ message: randomMessage });
});

const PDF_DIR = path.join(__dirname, "../new");

router.get("/download-pdf/:nationalId", (req, res) => {
  try {
    const nationalId = req.params.nationalId;

    // Validate national ID format
    if (!/^\d{5,10}$/.test(nationalId)) {
      return res.status(400).send("رقم الهوية غير صالح");
    }

    // Find matching PDF file
    const files = fs.readdirSync(PDF_DIR);
    const matchingFile = files.find((file) => file == "hajj_" + nationalId);

    if (!matchingFile) {
      return res.status(404).send("لم يتم العثور على الملف");
    }

    const filePath = path.join(PDF_DIR, matchingFile);

    // Set headers and send file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=hajj_${nationalId}.pdf`
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).send("حدث خطأ أثناء التحميل");
  }
});

/* GET home page. */
router.post(
  "/process-pdf",
  upload.array("pdfFiles"),
  async function (req, res, next) {
    try {
      const results = await Promise.all(
        req.files.map(async (file) => {
          return extractNationalIdFromPdf(file).then((nationalId) => {
            try {
              if (nationalId) {
                let pdfPath = file.path;

                // 4. Prepare new filename
                const dir = path.dirname(pdfPath);
                const ext = path.extname(pdfPath);
                const newFilename = `hajj_${nationalId}${ext}`;
                const newPath = path.join(dir + "/../new", newFilename);

                // 5. Rename the file
                fs.renameSync(pdfPath, newPath);

                //fs.unlinkSync(pdfPath);

                // res.json({
                //   originalName: file.originalname,
                //   nationalId,
                // });

                // Clean up uploaded file

                //console.log(`Successfully renamed file to: ${newFilename}`);

                //console.log("رقم الهوية الوطنية لحجاج الخليج:", nationalId);
              } else {
                console.log(
                  "رقم الهوية الوطنية لحجاج الخليج غير موجود في المستند."
                );
              }

              //console.log(file.originalname); // NOT originalName

              return {
                originalName: Buffer.from(file.originalname, "binary").toString(
                  "utf8"
                ),
                nationalId,
              };
            } catch (error) {
              console.error(`Error processing ${file.originalname}:`, error);
              return {
                originalName: file.originalname,
                error: error.message,
              };
            }
          });
        })
      );

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      console.log(results);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

async function extractNationalIdFromPdf(file) {
  try {
    // 1. Read the PDF file
    const dataBuffer = fs.readFileSync(file.path);

    // 2. Parse the PDF
    const data = await pdf(dataBuffer);

    // 3. Extract the national ID
    const text = data.text;
    const lines = text.split("\n");

    // for (let i = 0; i < lines.length; i++) {
    //   if (lines[i].includes("رقم الھویة الوطنیة لحجاج الخلیج")) {
    //     //console.log(lines[i]);
    //     // Look for numbers in the current line after colon
    //     const matchCurrentLine = lines[i].match(
    //       /رقم الھویة الوطنیة لحجاج الخلیج[:\s]*([0-9]+)/
    //     );
    //     if (matchCurrentLine && matchCurrentLine[1]) {
    //       return matchCurrentLine[1];
    //     }

    //     // // If not found, check the next line
    //     // if (i + 1 < lines.length) {
    //     //   const matchNextLine = lines[i + 1].trim().match(/^([0-9]+)/);
    //     //   if (matchNextLine && matchNextLine[1]) {
    //     //     return matchNextLine[1];
    //     //   }
    //     // }
    //   }
    // }

    return lines[4]; // Return null if not found
  } catch (error) {
    console.error("Error processing PDF:", error);
    return null;
  }
}

module.exports = router;
