import { Router } from "express";
import { getIndividualPaintingData, paintingUpload } from "../controllers/painting.controller.js";
import multer from 'multer';
const router = Router();
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../files'); // Ensure correct absolute path
        console.log("Saving to:", uploadPath);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        console.log("Saving file:", file.originalname);
        cb(null, Date.now() + '-' + file.originalname);
    }
});


const upload = multer({ storage: storage })

router.route('/newpaintingform/:id').post(upload.single('file'), paintingUpload);
router.route('/paintingpost/:id').get(getIndividualPaintingData)
export default router;

