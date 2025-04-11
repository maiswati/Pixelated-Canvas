import {Router} from 'express';
import { getTransactionData, postShippingAddress } from '../controllers/transaction.controller.js';
import { handleScreenshotSubmit } from '../controllers/transaction.controller.js';
const router = Router();
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(__dirname, '../files');
        console.log("Saving to:", uploadPath);
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        console.log("Saving file:", file.originalname);
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({storage: storage});

router.route('/transactiondata/:buyerId/:paintingId').get(getTransactionData);
router.route('/submitShippingAddress/:buyerId/:paintingId').post(postShippingAddress);
router.route('/screenshotUpload/:buyerId/:paintingId').post(upload.single('paymentScreenshotImage'), handleScreenshotSubmit);


export default router;