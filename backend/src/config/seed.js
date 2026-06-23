require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./database');
const {
  Role, User, Category, Product, ProductImage,
  Inventory, Voucher, Material
} = require('../models');

// ─── helpers ────────────────────────────────────────────────────────────────
const slug = (text) =>
  text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-');

const code = (prefix, n) => `${prefix}-${String(n).padStart(4, '0')}`;
const hash = (pw) => bcrypt.hashSync(pw, 12);

// ─── seed data ───────────────────────────────────────────────────────────────

const ROLES = [
  { name: 'admin',    description: 'Full system access' },
  { name: 'customer', description: 'Regular buyer' },
  { name: 'staff',    description: 'Sales & order staff' },
  { name: 'manager',  description: 'Store operations manager' }
];

const USERS = [
  { fullName: 'Admin User',     email: 'admin@yarnshop.com',    password: 'Admin@123',    roleKey: 'admin',    phone: '0900000001' },
  { fullName: 'Store Manager',  email: 'manager@yarnshop.com',  password: 'Manager@123',  roleKey: 'manager',  phone: '0900000002' },
  { fullName: 'Sales Staff',    email: 'staff@yarnshop.com',    password: 'Staff@123',    roleKey: 'staff',    phone: '0900000003' },
  { fullName: 'Jane Customer',  email: 'jane@example.com',      password: 'Customer@123', roleKey: 'customer', phone: '0900000004', address: '123 Nguyen Hue, District 1, HCMC' },
  { fullName: 'Minh Nguyen',    email: 'minh@example.com',      password: 'Customer@123', roleKey: 'customer', phone: '0912345678', address: '45 Le Loi, Hoan Kiem, Hanoi' },
  { fullName: 'Linh Tran',      email: 'linh@example.com',      password: 'Customer@123', roleKey: 'customer', phone: '0987654321', address: '8 Tran Phu, Hai Chau, Da Nang' }
];

// Parent categories
const CATEGORIES = [
  // Raw materials
  { name: 'Cotton Yarn',    type: 'raw_material',    description: 'Natural and blended cotton threads' },
  { name: 'Acrylic Yarn',   type: 'raw_material',    description: 'Soft, durable synthetic yarn' },
  { name: 'Special Yarn',   type: 'raw_material',    description: 'Velvet, mohair, metallic, and novelty yarns' },
  // Accessories
  { name: 'Hooks & Needles', type: 'accessory',      description: 'Crochet hooks and knitting needles' },
  { name: 'Filling & Eyes',  type: 'accessory',      description: 'Poly-fill, safety eyes, nose buttons' },
  { name: 'Tools & Notions', type: 'accessory',      description: 'Stitch markers, needles, row counters' },
  // Finished products
  { name: 'Stuffed Animals', type: 'finished_product', description: 'Handmade amigurumi and plush toys' },
  { name: 'Bags & Purses',   type: 'finished_product', description: 'Crochet and knitted bags' },
  { name: 'Fashion & Decor', type: 'finished_product', description: 'Scarves, keychains, flowers, and home decor' }
];

// Products: [categoryIndex(0-based), code, name, color, size, weight, price, salePrice, stock, description]
const PRODUCTS = [
  // Cotton Yarn (cat 0)
  [0,'PRD-0001','Milk Cotton Yarn 50g','White',null,50,35000,null,120,'Ultra-soft milk cotton yarn, perfect for amigurumi and baby items. Weight: 50g/120m.'],
  [0,'PRD-0002','Milk Cotton Yarn 50g','Pink',null,50,35000,null,100,'Pastel pink milk cotton yarn. Smooth texture, great for toys and accessories.'],
  [0,'PRD-0003','Milk Cotton Yarn 50g','Lavender',null,50,35000,null,80,'Soft lavender milk cotton — popular for stuffed animals and bags.'],
  [0,'PRD-0004','Milk Cotton Yarn 50g','Cream',null,50,35000,null,90,'Warm cream tone milk cotton, versatile for all crochet projects.'],
  [0,'PRD-0005','Milk Cotton Yarn 50g','Sky Blue',null,50,35000,null,75,'Light sky blue cotton yarn, ideal for summer projects.'],
  [0,'PRD-0006','4-Ply Cotton Yarn 100g','Natural',null,100,45000,40000,60,'Premium 4-ply cotton thread, natural undyed color. 100g/200m.'],
  [0,'PRD-0007','4-Ply Cotton Yarn 100g','Black',null,100,45000,40000,50,'Classic black 4-ply cotton for bold designs.'],
  // Acrylic Yarn (cat 1)
  [1,'PRD-0008','Acrylic Yarn 100g','Coral Red',null,100,28000,null,110,'Bright coral-red acrylic yarn, colourfast and machine washable. 100g/200m.'],
  [1,'PRD-0009','Acrylic Yarn 100g','Mint Green',null,100,28000,null,95,'Fresh mint green acrylic, soft and easy to work with.'],
  [1,'PRD-0010','Acrylic Yarn 100g','Lemon Yellow',null,100,28000,null,85,'Sunny yellow acrylic yarn — ideal for flowers and summer accessories.'],
  [1,'PRD-0011','Acrylic Yarn 100g','Charcoal',null,100,28000,null,70,'Dark charcoal acrylic for modern, stylish projects.'],
  // Special Yarn (cat 2)
  [2,'PRD-0012','Velvet Yarn 100g','Rose Gold',null,100,55000,49000,40,'Luxurious velvet yarn with subtle sheen. Incredibly soft finish. 100g/120m.'],
  [2,'PRD-0013','Velvet Yarn 100g','Navy Blue',null,100,55000,49000,35,'Deep navy velvet yarn, perfect for plush toys and bags.'],
  [2,'PRD-0014','Mohair Yarn 25g','Dusty Pink',null,25,65000,null,30,'Fluffy mohair blend gives an airy, cloud-like texture. 25g/200m.'],
  [2,'PRD-0015','Metallic Crochet Thread 50g','Gold',null,50,48000,null,25,'Fine metallic thread for decorative accents and jewelry projects.'],
  // Hooks & Needles (cat 3)
  [3,'PRD-0016','Bamboo Crochet Hook Set','Natural','9 pcs (2mm–6mm)',null,85000,75000,45,'Premium bamboo hooks, smooth finish. Sizes: 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0mm.'],
  [3,'PRD-0017','Ergonomic Crochet Hook 3.5mm','Purple','3.5mm',null,32000,null,60,'Soft-grip ergonomic handle reduces hand fatigue. Great for long crochet sessions.'],
  [3,'PRD-0018','Steel Knitting Needles 4mm','Silver','4mm / 25cm',null,25000,null,80,'Smooth stainless steel needles, sold as a pair. 25cm length.'],
  [3,'PRD-0019','Circular Knitting Needle 5mm','Silver','5mm / 60cm',null,38000,null,40,'Flexible cable circular needle, ideal for knitting in the round.'],
  // Filling & Eyes (cat 4)
  [4,'PRD-0020','Safety Eyes 6mm Black (10 pairs)','Black','6mm',null,15000,null,200,'Professional-grade safety eyes with locking washers. 10 pairs.'],
  [4,'PRD-0021','Safety Eyes 9mm Black (10 pairs)','Black','9mm',null,18000,null,180,'Larger safety eyes for bigger plushies. 10 pairs.'],
  [4,'PRD-0022','Colored Safety Eyes 12mm (5 pairs)','Mixed','12mm',null,22000,null,120,'Assorted colours (blue, green, brown, amber, red). 5 pairs.'],
  [4,'PRD-0023','Poly-fill Stuffing 200g','White','200g bag',200,32000,29000,150,'Premium hollow-fibre poly-fill, hypoallergenic. 200g bag.'],
  [4,'PRD-0024','Safety Nose 12mm Brown (5 pcs)','Brown','12mm',null,12000,null,160,'Triangle nose buttons with locking backs. 5 pieces.'],
  // Tools & Notions (cat 5)
  [5,'PRD-0025','Stitch Marker Set (50 pcs)','Multicolor',null,null,22000,null,90,'Locking plastic stitch markers, assorted colours. 50 pieces.'],
  [5,'PRD-0026','Tapestry Needle Set (10 pcs)','Silver',null,null,20000,null,100,'Blunt-tip yarn needles in assorted sizes. 10 pieces.'],
  [5,'PRD-0027','Row Counter Tally','Blue',null,null,25000,null,60,'Mechanical row counter that clips to your needle.'],
  [5,'PRD-0028','Scissors — Mini Craft','Black/Red','11cm',null,18000,null,70,'Sharp stainless-steel craft scissors with protective cover.'],
  // Stuffed Animals (cat 6)
  [6,'PRD-0029','Wool Teddy Bear 20cm','Brown','20cm tall',null,185000,169000,30,'Handmade amigurumi teddy bear, stuffed with premium poly-fill. Gift-boxed.'],
  [6,'PRD-0030','Wool Teddy Bear 30cm','White','30cm tall',null,265000,null,20,'Large white teddy bear, perfect gift for any occasion.'],
  [6,'PRD-0031','Crochet Bunny 25cm','Gray','25cm tall',null,195000,179000,25,'Adorable floppy-ear bunny in soft gray yarn. Comes with a ribbon bow.'],
  [6,'PRD-0032','Crochet Corgi Dog 20cm','Orange & White','20cm',null,210000,null,15,'Detailed Welsh Corgi amigurumi with embroidered features.'],
  [6,'PRD-0033','Amigurumi Axolotl 15cm','Pink','15cm',null,155000,139000,18,'Quirky axolotl plushie in pastel pink with gills detail.'],
  [6,'PRD-0034','Wool Cat Keychain 8cm','Gray','8cm',null,65000,null,50,'Miniature crochet cat keychain, sturdy metal clasp.'],
  [6,'PRD-0035','Wool Bunny Keychain 8cm','White','8cm',null,65000,null,50,'Mini bunny keychain, white with pink inner ears.'],
  // Bags & Purses (cat 7)
  [7,'PRD-0036','Crochet Tote Bag','Beige','35×30cm',null,320000,289000,12,'Sturdy cotton crochet tote bag with inner lining. Great for shopping or beach.'],
  [7,'PRD-0037','Mini Crochet Crossbody Bag','Pink','20×15cm',null,245000,null,10,'Cute small crossbody bag with adjustable strap. Perfect for outings.'],
  [7,'PRD-0038','Knitted Phone Pouch','Cream','Fits up to 6.7"',null,95000,85000,20,'Snug knitted phone sleeve with button closure.'],
  [7,'PRD-0039','Crochet Coin Purse','Mint Green','10×8cm',null,55000,null,35,'Small coin purse with zipper, flower detail on front.'],
  // Fashion & Decor (cat 8)
  [8,'PRD-0040','Knitted Winter Scarf','Gray','160×18cm',null,145000,129000,15,'Soft chunky-knit scarf in warm gray. Machine washable acrylic yarn.'],
  [8,'PRD-0041','Crochet Flower Bouquet (5 pcs)','Mixed','20cm stems',null,120000,null,20,'Set of 5 handmade crochet flowers in assorted colours. Great as decor or gift.'],
  [8,'PRD-0042','Wool Sunflower Hair Clip','Yellow',null,null,45000,null,40,'Cheerful sunflower crochet hair clip. Metal alligator clip.'],
  [8,'PRD-0043','Crochet Coaster Set (4 pcs)','Natural & Terracotta','10cm diameter',null,88000,79000,25,'Set of 4 round cotton crochet coasters, thick and absorbent.'],
  [8,'PRD-0044','Amigurumi Succulent Plant','Green','12cm pot',null,75000,null,30,'Worry-free crochet succulent in a mini terracotta pot. Zero watering required!'],
  [8,'PRD-0045','Crochet Bookmark Set (3 pcs)','Mixed',null,null,42000,null,45,'3 cute crochet bookmarks (strawberry, cat, and star). Great stocking stuffer.']
];

const MATERIALS = [
  { name: 'Milk Cotton Yarn',     unit: 'gram',  stock: 10000, costPerUnit: 700,  description: 'Raw milk cotton for production' },
  { name: '4-Ply Cotton Yarn',    unit: 'gram',  stock: 8000,  costPerUnit: 450,  description: 'Standard 4-ply cotton thread' },
  { name: 'Acrylic Yarn',         unit: 'gram',  stock: 12000, costPerUnit: 280,  description: 'General-purpose acrylic yarn' },
  { name: 'Velvet Yarn',          unit: 'gram',  stock: 3000,  costPerUnit: 550,  description: 'Premium velvet yarn for plush products' },
  { name: 'Poly-fill Stuffing',   unit: 'gram',  stock: 5000,  costPerUnit: 160,  description: 'Hollow-fibre stuffing material' },
  { name: 'Safety Eyes 6mm',      unit: 'piece', stock: 500,   costPerUnit: 1500, description: 'Small safety eyes' },
  { name: 'Safety Eyes 9mm',      unit: 'piece', stock: 400,   costPerUnit: 1800, description: 'Medium safety eyes' },
  { name: 'Safety Nose 12mm',     unit: 'piece', stock: 300,   costPerUnit: 2400, description: 'Triangle nose buttons' },
  { name: 'Bamboo Hook (3.5mm)',   unit: 'piece', stock: 150,   costPerUnit: 8500, description: 'Bamboo crochet hook for production' },
  { name: 'Tapestry Needle',      unit: 'piece', stock: 200,   costPerUnit: 2000, description: 'Yarn sewing needle' }
];

const VOUCHERS = [
  {
    code: 'WELCOME10', type: 'percentage', value: 10,
    minOrderAmount: 100000, maxDiscountAmount: 50000,
    usageLimit: 200, startDate: new Date('2025-01-01'), endDate: new Date('2026-12-31'),
    isActive: true
  },
  {
    code: 'FREESHIP', type: 'free_shipping', value: 30000,
    minOrderAmount: 200000, maxDiscountAmount: 30000,
    usageLimit: 500, startDate: new Date('2025-01-01'), endDate: new Date('2026-12-31'),
    isActive: true
  },
  {
    code: 'SUMMER20', type: 'percentage', value: 20,
    minOrderAmount: 300000, maxDiscountAmount: 100000,
    usageLimit: 100, startDate: new Date('2025-06-01'), endDate: new Date('2025-08-31'),
    isActive: true
  },
  {
    code: 'FLASH50K', type: 'fixed', value: 50000,
    minOrderAmount: 500000, maxDiscountAmount: 50000,
    usageLimit: 50, startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'),
    isActive: true
  },
  {
    code: 'VIP30', type: 'percentage', value: 30,
    minOrderAmount: 1000000, maxDiscountAmount: 200000,
    usageLimit: 20, startDate: new Date('2025-01-01'), endDate: new Date('2026-06-30'),
    isActive: true
  }
];

// ─── main seed function ───────────────────────────────────────────────────────

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✓ PostgreSQL connected\n');

    // ── 1. Roles ────────────────────────────────────────────────────────────
    console.log('Seeding roles...');
    const createdRoles = await Promise.all(
      ROLES.map(r => Role.findOrCreate({ where: { name: r.name }, defaults: r }))
    );
    const roleMap = {};
    createdRoles.forEach(([role]) => { roleMap[role.name] = role.id; });
    console.log(`  ✓ ${createdRoles.length} roles`);

    // ── 2. Users ────────────────────────────────────────────────────────────
    console.log('Seeding users...');
    let userCount = 0;
    for (const u of USERS) {
      const [, created] = await User.findOrCreate({
        where: { email: u.email },
        defaults: {
          fullName: u.fullName, email: u.email,
          password: hash(u.password),
          phone: u.phone, address: u.address || null,
          roleId: roleMap[u.roleKey], isActive: true
        }
      });
      if (created) userCount++;
    }
    console.log(`  ✓ ${userCount} new users (${USERS.length} total)`);

    // Get admin id for voucher createdBy
    const adminUser = await User.findOne({ where: { email: 'admin@yarnshop.com' } });

    // ── 3. Categories ───────────────────────────────────────────────────────
    console.log('Seeding categories...');
    const catRecords = [];
    for (const c of CATEGORIES) {
      const [cat] = await Category.findOrCreate({
        where: { slug: slug(c.name) },
        defaults: { ...c, slug: slug(c.name) }
      });
      catRecords.push(cat);
    }
    console.log(`  ✓ ${catRecords.length} categories`);

    // ── 4. Products ─────────────────────────────────────────────────────────
    console.log('Seeding products...');
    let prodCount = 0;
    for (const p of PRODUCTS) {
      const [catIdx, pCode, name, color, size, weight, price, salePrice, stock, description] = p;
      const category = catRecords[catIdx];
      const productSlug = `${slug(name)}-${color ? slug(color) + '-' : ''}${pCode.toLowerCase()}`;

      const [product, created] = await Product.findOrCreate({
        where: { code: pCode },
        defaults: {
          code: pCode, name, slug: productSlug,
          categoryId: category.id,
          description, color, size,
          weight: weight || null,
          price, salePrice: salePrice || null,
          stock, status: 'active',
          isCustomizable: catIdx >= 6 // finished products are customizable
        }
      });

      if (created) {
        // Create inventory record
        await Inventory.findOrCreate({
          where: { productId: product.id },
          defaults: { productId: product.id, quantity: stock, minStockLevel: 5 }
        });
        prodCount++;
      }
    }
    console.log(`  ✓ ${prodCount} new products (${PRODUCTS.length} total)`);

    // ── 5. Materials ────────────────────────────────────────────────────────
    console.log('Seeding materials...');
    let matCount = 0;
    for (const m of MATERIALS) {
      const [, created] = await Material.findOrCreate({
        where: { name: m.name },
        defaults: m
      });
      if (created) matCount++;
    }
    console.log(`  ✓ ${matCount} new materials (${MATERIALS.length} total)`);

    // ── 6. Vouchers ─────────────────────────────────────────────────────────
    console.log('Seeding vouchers...');
    let voucherCount = 0;
    for (const v of VOUCHERS) {
      const [, created] = await Voucher.findOrCreate({
        where: { code: v.code },
        defaults: { ...v, createdBy: adminUser.id, usedCount: 0 }
      });
      if (created) voucherCount++;
    }
    console.log(`  ✓ ${voucherCount} new vouchers (${VOUCHERS.length} total)`);

    console.log('\n✅ Seed completed successfully!\n');
    console.log('─── Test Accounts ───────────────────────────────');
    USERS.forEach(u => console.log(`  [${u.roleKey.padEnd(8)}] ${u.email}  /  ${u.password}`));
    console.log('─────────────────────────────────────────────────');
    console.log('\n─── Voucher Codes ───────────────────────────────');
    VOUCHERS.forEach(v => console.log(`  ${v.code.padEnd(10)}  (${v.type})`));
    console.log('─────────────────────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    if (process.env.NODE_ENV === 'development') console.error(err);
    process.exit(1);
  }
}

seed();
