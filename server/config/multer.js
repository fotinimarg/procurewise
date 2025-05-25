const multer = require('multer');

// Multer storage configuration
const multerStorage = multer.memoryStorage();

// File filter
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else if (file.mimetype === 'application/json' || file.mimetype === 'text/csv') {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type! Please upload an image, a CSV or JSON file.'), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

module.exports = upload;
