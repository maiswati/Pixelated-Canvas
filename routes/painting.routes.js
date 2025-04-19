import { Router } from "express";
import { getIndividualPaintingData, paintingUpload } from "../controllers/painting.controller.js";
import upload from '../utils/upload.js'
const router = Router();

router.route('/newpaintingform/:id').post(upload.single('file'), paintingUpload);
router.route('/paintingpost/:id').get(getIndividualPaintingData)
export default router;

