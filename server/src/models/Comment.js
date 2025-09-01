import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: String, ref: 'User', required: true },
  content: { type: String, required: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // for replies
  likes: [{ type: String, ref: 'User' }],
  likes_count: { type: Number, default: 0 } // NEW FIELD
}, { timestamps: true })

const Comment = mongoose.model("Comment", commentSchema)
export default Comment
