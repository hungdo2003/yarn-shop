const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { ChatConversation, ChatMessage, User, Role, Livestream, LivestreamComment } = require('./models');
const { botReply } = require('./controllers/chat.controller');
const { notifyByRole } = require('./services/notificationService');

const onlineStaff = new Set();
// livestreamId -> socketId of broadcaster
const broadcasterSockets = new Map();
// livestreamId -> Set of viewer socketIds
const liveViewers = new Map();
// livestreamId -> peak viewer count
const peakViewers = new Map();

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Auth middleware — optional (guests allowed with role 'guest')
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.user = null;
      socket.role = 'guest';
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, { include: [{ model: Role }] });
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      socket.role = user.Role?.name;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { user, role } = socket;

    if (role === 'staff' || role === 'admin') {
      onlineStaff.add(socket.id);
      socket.join('staff_room');
      io.to('staff_room').emit('staff:online', onlineStaff.size);
    }

    // ── CHAT ──────────────────────────────────────────────────
    socket.on('customer:join', async (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('staff:join', async (conversationId) => {
      socket.join(`conv:${conversationId}`);
      const conv = await ChatConversation.findByPk(conversationId);
      if (conv && !conv.staffId) {
        await conv.update({ staffId: user.id, status: 'active' });
        io.to('staff_room').emit('conversations:update');
      }
      await ChatMessage.update(
        { isRead: true },
        { where: { conversationId, senderRole: 'customer', isRead: false } }
      );
      io.to('staff_room').emit('conversations:update');
    });

    socket.on('message:send', async ({ conversationId, content }) => {
      if (!content?.trim() || !user) return;
      try {
        const conv = await ChatConversation.findByPk(conversationId);
        if (!conv) return;
        if (role === 'customer' && conv.customerId !== user.id) return;

        const senderRole = (role === 'staff' || role === 'admin') ? 'staff' : 'customer';
        const msg = await ChatMessage.create({
          conversationId,
          senderId: user.id,
          senderRole,
          content: content.trim(),
          isRead: senderRole === 'staff',
        });
        await conv.update({ lastMessageAt: new Date() });

        const msgData = { ...msg.toJSON(), User: { id: user.id, fullName: user.fullName } };
        io.to(`conv:${conversationId}`).emit('message:new', msgData);
        io.to('staff_room').emit('conversations:update');

        if (senderRole === 'customer') {
          try {
            const reply = await botReply(content, user.id);
            if (reply) {
              setTimeout(async () => {
                try {
                  const botMsg = await ChatMessage.create({ conversationId, senderRole: 'bot', content: reply, isRead: false });
                  await conv.update({ lastMessageAt: new Date() });
                  io.to(`conv:${conversationId}`).emit('message:new', { ...botMsg.toJSON(), User: { id: null, fullName: 'YarnBot' } });
                  io.to('staff_room').emit('conversations:update');
                } catch (e) { console.error('bot setTimeout error:', e.message); }
              }, 900);
            }
          } catch (e) { console.error('botReply error:', e.message); }
        }
      } catch (err) {
        console.error('socket message:send error', err);
      }
    });

    socket.on('conversation:close', async (conversationId) => {
      if (role !== 'staff' && role !== 'admin') return;
      await ChatConversation.update({ status: 'closed' }, { where: { id: conversationId } });
      io.to(`conv:${conversationId}`).emit('conversation:closed');
      io.to('staff_room').emit('conversations:update');
    });

    // ── LIVESTREAM ────────────────────────────────────────────
    // Staff: start broadcasting
    socket.on('livestream:start_stream', async (livestreamId) => {
      if (role !== 'staff' && role !== 'admin') return;
      try {
        const stream = await Livestream.findByPk(livestreamId);
        if (!stream) return;
        stream.staffId === user?.id || role === 'admin'; // owner check
        await stream.update({ status: 'live', startedAt: new Date(), viewerCount: 0 });
        broadcasterSockets.set(livestreamId, socket.id);
        liveViewers.set(livestreamId, new Set());
        peakViewers.set(livestreamId, 0);
        socket.join(`ls:${livestreamId}`);
        io.emit('livestream:started', { id: livestreamId, title: stream.title });
        // Thông báo cho tất cả customer
        notifyByRole('customer', 'system',
          `🔴 YarnShop đang LIVE: ${stream.title}`,
          'Nhấn vào để tham gia xem và bình luận ngay!',
          { livestreamId, title: stream.title }
        );
      } catch (err) {
        console.error('livestream:start_stream error', err);
      }
    });

    // Viewer: join a livestream
    socket.on('livestream:join_as_viewer', async (livestreamId) => {
      try {
        const stream = await Livestream.findByPk(livestreamId);
        if (!stream || stream.status !== 'live') return;
        socket.join(`ls:${livestreamId}`);

        const viewers = liveViewers.get(livestreamId) || new Set();
        viewers.add(socket.id);
        liveViewers.set(livestreamId, viewers);

        const count = viewers.size;
        const peak = Math.max(peakViewers.get(livestreamId) ?? 0, count);
        peakViewers.set(livestreamId, peak);
        await Livestream.update({ viewerCount: peak }, { where: { id: livestreamId } });
        io.to(`ls:${livestreamId}`).emit('livestream:viewer_count', count);

        // Notify broadcaster to send WebRTC offer to this viewer
        const broadcasterSocketId = broadcasterSockets.get(livestreamId);
        if (broadcasterSocketId) {
          io.to(broadcasterSocketId).emit('livestream:viewer_joined', {
            viewerSocketId: socket.id,
            viewerName: user?.fullName || socket.handshake.auth?.guestName || 'Khách',
          });
        }
      } catch (err) {
        console.error('livestream:join_as_viewer error', err);
      }
    });

    // Viewer: leave livestream
    socket.on('livestream:leave_viewer', (livestreamId) => {
      socket.leave(`ls:${livestreamId}`);
      const viewers = liveViewers.get(livestreamId);
      if (viewers) {
        viewers.delete(socket.id);
        io.to(`ls:${livestreamId}`).emit('livestream:viewer_count', viewers.size);
      }
    });

    // Comment (viewer or staff)
    socket.on('livestream:comment', async ({ livestreamId, content, guestName }) => {
      if (!content?.trim()) return;
      try {
        const stream = await Livestream.findByPk(livestreamId);
        if (!stream) return;

        const comment = await LivestreamComment.create({
          livestreamId,
          userId: user?.id || null,
          guestName: user ? null : (guestName?.trim() || 'Khách'),
          content: content.trim(),
        });

        const displayName = user?.fullName || guestName?.trim() || 'Khách';
        io.to(`ls:${livestreamId}`).emit('livestream:comment_new', {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          displayName,
          userId: user?.id || null,
        });
      } catch (err) {
        console.error('livestream:comment error', err);
      }
    });

    // Staff: end stream
    socket.on('livestream:end_stream', async (livestreamId) => {
      if (role !== 'staff' && role !== 'admin') return;
      try {
        const finalPeak = peakViewers.get(livestreamId) ?? 0;
        await Livestream.update(
          { status: 'ended', endedAt: new Date(), viewerCount: finalPeak },
          { where: { id: livestreamId } }
        );
        broadcasterSockets.delete(livestreamId);
        liveViewers.delete(livestreamId);
        peakViewers.delete(livestreamId);
        io.to(`ls:${livestreamId}`).emit('livestream:stream_ended');
        io.emit('livestream:ended', { id: livestreamId });
      } catch (err) {
        console.error('livestream:end_stream error', err);
      }
    });

    // ── WebRTC signaling ──────────────────────────────────────
    // Staff → Viewer: send offer
    socket.on('rtc:offer', ({ targetSocketId, offer }) => {
      io.to(targetSocketId).emit('rtc:offer', { fromSocketId: socket.id, offer });
    });

    // Viewer → Staff: send answer
    socket.on('rtc:answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('rtc:answer', { fromSocketId: socket.id, answer });
    });

    // ICE candidate exchange
    socket.on('rtc:ice', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('rtc:ice', { fromSocketId: socket.id, candidate });
    });

    // ── Disconnect ────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (role === 'staff' || role === 'admin') {
        onlineStaff.delete(socket.id);
        io.to('staff_room').emit('staff:online', onlineStaff.size);
      }
      // Clean up viewer from all livestream rooms
      liveViewers.forEach((viewers, livestreamId) => {
        if (viewers.has(socket.id)) {
          viewers.delete(socket.id);
          io.to(`ls:${livestreamId}`).emit('livestream:viewer_count', viewers.size);
        }
      });
    });
  });

  return io;
}

module.exports = initSocket;
