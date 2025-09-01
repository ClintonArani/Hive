import express from 'express'
import { protect } from '../middlewares/auth.js';
import { addComment, getPostComments, likeComment} from '../controllers/commentController.js';

const commentRouter = express.Router();

commentRouter.post('/add', protect, addComment);
commentRouter.get('/:postId', protect, getPostComments);
commentRouter.post('/like', protect, likeComment);

export default commentRouter