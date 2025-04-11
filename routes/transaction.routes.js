import { createOrder, paymentVerification } from "../controllers/transaction.controller.js";
import { postShippingAddress } from "../controllers/transaction.controller.js";

router.post('/createOrder/:paymentId', createOrder);
router.post('/verify', paymentVerification )
router.post('/submitShippingAddress/:paintingId/:buyerId', postShippingAddress);
export default router;