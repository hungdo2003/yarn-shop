const router = require('express').Router();
const { getAll, getById, updateProfile, updateUser, deleteUser } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');

router.get('/', authenticate, authorize('admin', 'manager'), getAll);
router.get('/:id', authenticate, authorize('admin', 'manager'), getById);
router.put('/profile', authenticate, uploadAvatar.single('avatar'), updateProfile);
router.put('/:id', authenticate, authorize('admin'), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

module.exports = router;
