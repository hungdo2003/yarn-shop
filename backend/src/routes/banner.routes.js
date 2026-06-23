const router = require('express').Router();
const ctrl = require('../controllers/banner.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dir = 'uploads/banners';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, dir),
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/public', ctrl.getPublic);
router.get('/', authenticate, authorize('admin'), ctrl.getAll);
router.post('/', authenticate, authorize('admin'), upload.single('image'), ctrl.create);
router.put('/:id', authenticate, authorize('admin'), upload.single('image'), ctrl.update);
router.delete('/:id', authenticate, authorize('admin'), ctrl.delete);

module.exports = router;
