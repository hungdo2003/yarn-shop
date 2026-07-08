const { Livestream, LivestreamComment, User } = require('../models');
const { notifyByRole } = require('../services/notificationService');

const staffAttr = ['id', 'fullName', 'avatar'];

const fmtScheduled = (d) =>
  new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const streams = await Livestream.findAll({
      where,
      include: [{ model: User, as: 'staff', attributes: staffAttr }],
      order: [['createdAt', 'DESC']],
    });
    res.json(streams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const stream = await Livestream.findByPk(req.params.id, {
      include: [{ model: User, as: 'staff', attributes: staffAttr }],
    });
    if (!stream) return res.status(404).json({ message: 'Không tìm thấy livestream' });
    res.json(stream);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, scheduledAt } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Tiêu đề không được để trống' });

    let parsedSchedule = null;
    if (scheduledAt) {
      parsedSchedule = new Date(scheduledAt);
      if (isNaN(parsedSchedule.getTime())) return res.status(400).json({ message: 'Thời gian dự kiến không hợp lệ' });
      if (parsedSchedule <= new Date()) return res.status(400).json({ message: 'Thời gian dự kiến phải ở tương lai' });
    }

    const stream = await Livestream.create({
      title: title.trim(),
      description: description?.trim(),
      staffId: req.user.id,
      scheduledAt: parsedSchedule,
    });

    const full = await Livestream.findByPk(stream.id, {
      include: [{ model: User, as: 'staff', attributes: staffAttr }],
    });

    // Thông báo cho tất cả customer khi có lịch dự kiến
    if (parsedSchedule) {
      notifyByRole('customer', 'system',
        `📅 Livestream sắp diễn ra: ${stream.title}`,
        `YarnShop sẽ livestream vào lúc ${fmtScheduled(parsedSchedule)}. Đừng bỏ lỡ nhé!`,
        { livestreamId: stream.id, scheduledAt: parsedSchedule }
      );
    }

    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const stream = await Livestream.findByPk(req.params.id);
    if (!stream) return res.status(404).json({ message: 'Không tìm thấy livestream' });
    const isOwner = stream.staffId === req.user.id;
    const isAdmin = req.user.Role?.name === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Không có quyền' });
    const { title, description } = req.body;
    await stream.update({ title: title?.trim() || stream.title, description: description?.trim() });
    res.json(stream);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.end = async (req, res) => {
  try {
    const stream = await Livestream.findByPk(req.params.id);
    if (!stream) return res.status(404).json({ message: 'Không tìm thấy livestream' });
    const isOwner = stream.staffId === req.user.id;
    const isAdmin = req.user.Role?.name === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Không có quyền' });
    await stream.update({ status: 'ended', endedAt: new Date() });
    res.json(stream);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await LivestreamComment.findAll({
      where: { livestreamId: req.params.id },
      include: [{ model: User, attributes: ['id', 'fullName', 'avatar'], required: false }],
      order: [['createdAt', 'ASC']],
      limit: 200,
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
