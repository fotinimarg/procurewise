const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const csvParser = require('csv-parser');
const { handleJSONData, handleCSVData } = require('../helpers/imports');
const { verifyAdmin } = require('../middleware/authMiddleware')

// Import supplier using a file
router.post('/import-supplier', upload.single('file'), verifyAdmin, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const fileBuffer = req.file.buffer;
        const fileType = req.file.mimetype;

        if (fileType === 'application/json') {
            const data = JSON.parse(fileBuffer.toString());
            await handleJSONData(data);
            res.status(200).send('JSON file processed successfully');
        } else if (fileType === 'text/csv') {
            const results = [];
            const stream = require('stream');
            const readableStream = new stream.Readable();
            readableStream._read = () => { };
            readableStream.push(fileBuffer);
            readableStream.push(null);

            readableStream
                .pipe(csvParser())
                .on('data', (row) => results.push(row))
                .on('end', async () => {
                    await handleCSVData(results);
                    res.status(200).send('CSV file processed successfully');
                })
                .on('error', (err) => {
                    console.error(err);
                    res.status(500).send('Error processing CSV file');
                });
        } else {
            return res.status(400).send('Unsupported file format');
        }

    } catch (error) {
        console.error(error);
        res.status(500).send(`Error processing the file: ${error.message}`);
    }
});

module.exports = router;