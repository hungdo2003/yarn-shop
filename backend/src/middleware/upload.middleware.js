const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const hasCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Chỉ chấp nhận file ảnh'), false);
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;

function makeUploader(folder) {
  if (hasCloudinary) {
    const storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: `yarnshop/${folder}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
    });
    return multer({ storage, fileFilter: imageFilter, limits: { fileSize: maxSize } });
  }
  // Fallback: local disk
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, `uploads/${folder}`),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  });
  return multer({ storage, fileFilter: imageFilter, limits: { fileSize: maxSize } });
}

const uploadProduct = makeUploader('products');
const uploadCustomOrder = makeUploader('custom-orders');
const uploadReview = makeUploader('reviews');
const uploadAvatar = makeUploader('avatars');

// Helper: get usable URL from a file (Cloudinary path or local)
function fileUrl(file) {
  return file.path || `/uploads/${file.filename}`;
}

module.exports = { uploadProduct, uploadCustomOrder, uploadReview, uploadAvatar, fileUrl, cloudinary, hasCloudinary };
