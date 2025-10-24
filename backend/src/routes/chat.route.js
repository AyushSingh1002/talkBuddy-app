import express from 'express';
const router = express.Router();
import { chatStart, clearChatHistory, getConversationHistory } from '../controllers/chat.controller.js';

// Chat routes
router.post('/', chatStart);
router.get('/history/:conversationId', getConversationHistory);
router.delete('/history/:conversationId', clearChatHistory);

export default router
