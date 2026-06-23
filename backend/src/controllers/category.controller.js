const { Category } = require('../models');
const { slugify } = require('../utils/helpers');

const getAll = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Category, as: 'children' }],
      where: { parentId: null },
      order: [['name', 'ASC']]
    });
    res.json(categories);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  try {
    const { name, type, description, parentId } = req.body;
    const slug = slugify(name);
    const cat = await Category.create({ name, slug, type, description, parentId: parentId || null });
    res.status(201).json(cat);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const update = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    const { name, ...rest } = req.body;
    const updates = { ...rest };
    if (name) { updates.name = name; updates.slug = slugify(name); }
    await cat.update(updates);
    res.json(cat);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    await cat.destroy();
    res.json({ message: 'Category deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAll, create, update, remove };
