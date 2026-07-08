const router = require('express').Router();
const ctrl = require('../controllers/return.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dir = 'uploads/returns';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, dir),
  filename:    (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

router.post('/',                authenticate, upload.array('images', 5), ctrl.create);
router.get('/my',               authenticate, ctrl.getMyRequests);
router.post('/:id/pay-wallet',  authenticate, ctrl.payWallet);
router.post('/:id/pay-payos',   authenticate, ctrl.payPayos);
router.get('/',                 authenticate, authorize('admin', 'manager', 'staff'), ctrl.getAll);
router.patch('/:id',            authenticate, authorize('admin', 'manager', 'staff'), ctrl.update);

module.exports = router;
