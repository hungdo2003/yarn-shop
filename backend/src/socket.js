const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { ChatConversation, ChatMessage, User, Role } = require('./models');
const { botReply } = require('./controllers/chat.controller');

const onlineStaff = new Set(); // socket ids of connected staff

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
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

    // Customer: join their own conversation room
    socket.on('customer:join', async (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    // Staff: join a specific conversation
    socket.on('staff:join', async (conversationId) => {
      socket.join(`conv:${conversationId}`);
      // Assign staff to conversation if not assigned
      const conv = await ChatConversation.findByPk(conversationId);
      if (conv && !conv.staffId) {
        await conv.update({ staffId: user.id, status: 'active' });
        io.to('staff_room').emit('conversations:update');
      }
      // Mark customer messages read
      await ChatMessage.update(
        { isRead: true },
        { where: { conversationId, senderRole: 'customer', isRead: false } }
      );
      io.to('staff_room').emit('conversations:update');
    });

    // Send message
    socket.on('message:send', async ({ conversationId, content }) => {
      if (!content?.trim()) return;
      try {
        const conv = await ChatConversation.findByPk(conversationId);
        if (!conv) return;

        // Security: customer can only send to their own conv
        if (role === 'customer' && conv.customerId !== user.id) return;

        const senderRole = (role === 'staff' || role === 'admin') ? 'staff' : 'customer';
        const msg = await ChatMessage.create({
          conversationId,
          senderId: user.id,
          senderRole,
          content: content.trim(),
          isRead: senderRole === 'staff', // staff messages are immediately "read" by themselves
        });

        await conv.update({ lastMessageAt: new Date() });

        const msgData = {
          ...msg.toJSON(),
          User: { id: user.id, fullName: user.fullName },
        };

        // Broadcast to everyone in the conversation room
        io.to(`conv:${conversationId}`).emit('message:new', msgData);
        // Notify staff room to refresh list
        io.to('staff_room').emit('conversations:update');

        // Bot reply for customer messages
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

    // Staff closes conversation
    socket.on('conversation:close', async (conversationId) => {
      if (role !== 'staff' && role !== 'admin') return;
      await ChatConversation.update({ status: 'closed' }, { where: { id: conversationId } });
      // Notify customer
      io.to(`conv:${conversationId}`).emit('conversation:closed');
      io.to('staff_room').emit('conversations:update');
    });

    socket.on('disconnect', () => {
      if (role === 'staff' || role === 'admin') {
        onlineStaff.delete(socket.id);
        io.to('staff_room').emit('staff:online', onlineStaff.size);
      }
    });
  });

  return io;
}

module.exports = initSocket;
