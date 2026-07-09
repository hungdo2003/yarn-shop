require('dotenv').config();
const { SaleEventRun, SaleEventRunProduct, Product } = require('./src/models');

(async () => {
  // Remove test row inserted earlier
  await SaleEventRunProduct.destroy({ where: { productId: 999 }, truncate: false });

  // Find all runs that have productCount > 0 but no runProducts saved
  const runs = await SaleEventRun.findAll({ where: {} });
  for (const run of runs) {
    if (!run.productCount) continue;
    const existing = await SaleEventRunProduct.count({ where: { runId: run.id } });
    if (existing > 0) { console.log(`Run ${run.id}: already has ${existing} products`); continue; }

    // Fetch current products still in the event as best-effort snapshot
    const products = await Product.findAll({
      where: { saleEventId: run.saleEventId },
      attributes: ['id', 'name', 'price', 'salePrice', 'thumbnailImage'],
    });

    if (!products.length) { console.log(`Run ${run.id}: no current products in event ${run.saleEventId}, skipping`); continue; }

    await SaleEventRunProduct.bulkCreate(products.map(p => ({
      runId: run.id,
      productId: p.id,
      name: p.name,
      price: p.price,
      salePrice: p.salePrice,
      thumbnailImage: p.thumbnailImage,
    })));
    console.log(`Run ${run.id}: inserted ${products.length} products`);
  }

  const total = await SaleEventRunProduct.count();
  console.log('Total SaleEventRunProducts rows now:', total);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
