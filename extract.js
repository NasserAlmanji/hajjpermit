const fs = require("fs");
const path = require("path");

const pdf = require("pdf-parse");

async function extractNationalIdFromPdf(pdfPath) {
  try {
    // 1. Read the PDF file
    const dataBuffer = fs.readFileSync(pdfPath);

    // 2. Parse the PDF
    const data = await pdf(dataBuffer);

    // 3. Extract the national ID
    const text = data.text;
    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("رقم الھویة الوطنیة لحجاج الخلیج")) {
        //console.log(lines[i]);
        // Look for numbers in the current line after colon
        const matchCurrentLine = lines[i].match(
          /رقم الھویة الوطنیة لحجاج الخلیج[:\s]*([0-9]+)/
        );
        if (matchCurrentLine && matchCurrentLine[1]) {
          return matchCurrentLine[1];
        }

        // // If not found, check the next line
        // if (i + 1 < lines.length) {
        //   const matchNextLine = lines[i + 1].trim().match(/^([0-9]+)/);
        //   if (matchNextLine && matchNextLine[1]) {
        //     return matchNextLine[1];
        //   }
        // }
      }
    }

    return null; // Return null if not found
  } catch (error) {
    console.error("Error processing PDF:", error);
    return null;
  }
}

// Usage example
const pdfPath = "محمود سعيد العويدي.pdf"; // Replace with your PDF path

extractNationalIdFromPdf(pdfPath).then((nationalId) => {
  if (nationalId) {
    // 4. Prepare new filename
    const dir = path.dirname(pdfPath);
    const ext = path.extname(pdfPath);
    const newFilename = `hajj_${nationalId}${ext}`;
    const newPath = path.join(dir + "/new", newFilename);

    // 5. Rename the file
    fs.renameSync(pdfPath, newPath);

    console.log(`Successfully renamed file to: ${newFilename}`);

    console.log("رقم الهوية الوطنية لحجاج الخليج:", nationalId);
  } else {
    console.log("رقم الهوية الوطنية لحجاج الخليج غير موجود في المستند.");
  }
});
