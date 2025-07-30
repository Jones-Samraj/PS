const express = require('express');
const multer = require('multer'); //Multer is a middleware for handling file uploads in Node.js
const csvParser = require('csv-parser'); //A library to parse CSV files into JavaScript objects, making it easy to read CSV data line by line
const xlsx = require('xlsx'); //A library for reading and writing Excel files (XLSX) in Node.js
const fs = require('fs'); //A core Node.js module for working with file systems (reading, writing, and managing files)
const path = require('path'); //A core Node.js module to handle and manipulate file and directory paths in a cross-platform way

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

module.exports = (db) => {
  router.post('/bulk-upload', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const course_id = req.body.course_id;

    let questions = [];

    try {
      if (ext === '.csv') {
        const rows = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => rows.push(row))
            .on('end', () => resolve())
            .on('error', reject);
        });
        questions = rows;
      } else if (ext === '.xlsx') {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        questions = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: 'Only .csv or .xlsx files allowed' });
      }
    } catch (err) {
      fs.unlinkSync(filePath);
      return res.status(500).json({ error: 'Failed to read file' });
    }

    const validEntries = [];
    const errors = [];

    for (let [i, q] of questions.entries()) {
      const {
        question, option1, option2, option3, option4, correct_option
      } = q;

      if (!question || !option1 || !option2 || !option3 || !option4 || !correct_option) {
        errors.push({ row: i + 2, message: 'Missing required fields' });
        continue;
      }

      validEntries.push([
        course_id, question,
        option1, option2, option3, option4,
        correct_option
      ]);
    }

    if (validEntries.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'No valid entries to insert', errors });
    }

    // Remove duplicates based on course_id and question
    const courseQuestionMap = new Map();
    const filteredEntries = [];

    for (let entry of validEntries) {
      const [cid, question] = entry;
      const key = `${cid}_${question}`;
      if (!courseQuestionMap.has(key)) {
        courseQuestionMap.set(key, true);
        filteredEntries.push(entry);
      }
    }

    // Check if the MCQs already exist in the database
    const sqlCheck = `SELECT question, course_id FROM mcqs`;
    db.query(sqlCheck, (err, existingRows) => {
      if (err) {
        fs.unlinkSync(filePath);
        return res.status(500).json({ error: 'DB check failed' });
      }

      // Create a set of existing entries for fast lookup
      const existingSet = new Set(
        existingRows.map(r => `${r.course_id}_${r.question}`)
      );

      // Filter out existing MCQs from the entries to insert
      const finalEntries = filteredEntries.filter(entry => {
        const key = `${entry[0]}_${entry[1]}`;
        return !existingSet.has(key);
      });

      if (finalEntries.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(200).json({ message: 'No new unique MCQs to insert', duplicates: filteredEntries.length });
      }

      // Insert new unique MCQs into the database
      const sqlInsert = `
        INSERT INTO mcqs (course_id, question, option1, option2, option3, option4, correct_option)
        VALUES ?
      `;

      db.query(sqlInsert, [finalEntries], (err, result) => {
        fs.unlinkSync(filePath);
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Insert failed' });
        }

        res.status(200).json({
          message: 'Bulk upload successful',
          inserted: result.affectedRows,
          skipped: validEntries.length - finalEntries.length,
          invalid: errors.length,
          errors
        });
      });
    });
  });

  return router;
};
