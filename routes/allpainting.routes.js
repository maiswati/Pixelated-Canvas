import {Router} from 'express';
import { fetchAllPaintingsForGallery } from '../controllers/allpaintings.controller.js';
const router = Router();

router.route('/allpaintings').get(fetchAllPaintingsForGallery);

export default router;