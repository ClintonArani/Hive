import express from 'express'
import { getChatMessages, sendMessage, sseController } from '../controllers/messageController.js'
import { upload } from '../configs/multer.js'
import { protect } from '../middlewares/auth.js'

const messageRoute = express.Router()

messageRoute.get('/:userId', sseController)
messageRoute.post('/send', upload.single('image'), protect, sendMessage)
messageRoute.post('/get', protect, getChatMessages)

export default messageRoute