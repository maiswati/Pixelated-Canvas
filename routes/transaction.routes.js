import {Router} from 'express';
import { createOrder, paymentVerification } from "../controllers/transaction.controller.js";
import { postShippingAddress } from "../controllers/transaction.controller.js";

const router = Router();
router.post('/createOrder/:paymentId', createOrder);
router.post('/verify', paymentVerification )
router.post('/submitShippingAddress/:paintingId/:buyerId', postShippingAddress);
export default router;