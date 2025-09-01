import Comment from "../models/Comment.js";
import Post from "../models/Post.js";

// Add a new comment
export const addComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId, content, parentComment } = req.body;

    // check post exists
    const post = await Post.findById(postId);
    if (!post) return res.json({ success: false, message: "Post not found" });

    const comment = await Comment.create({
      post: postId,
      user: userId,
      content,
      parentComment: parentComment || null,
      likes: [], // always initialize
      likes_count: 0
    });

    // 🔥 Sync post's comments_count
    await Post.findByIdAndUpdate(postId, { $inc: { comments_count: 1 } });

    res.json({ success: true, message: "Comment added", comment });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Get comments for a post (with nested replies + likes count)
export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.auth(); // so we can check if current user liked

    // fetch top-level comments
    const comments = await Comment.find({ post: postId, parentComment: null })
      .populate("user", "username full_name profile_picture")
      .sort({ createdAt: -1 })
      .lean();

    // fetch replies for each comment
    const commentWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .populate("user", "username full_name profile_picture")
          .sort({ createdAt: -1 })
          .lean();

        return {
          ...comment,
          likes_count: comment.likes?.length || 0,
          isLiked: comment.likes?.includes(userId), // frontend can use this
          replies: replies.map((r) => ({
            ...r,
            likes_count: r.likes?.length || 0,
            isLiked: r.likes?.includes(userId)
          }))
        };
      })
    );

    res.json({ success: true, comments: commentWithReplies });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Like or unlike a comment
export const likeComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { commentId } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment)
      return res.json({ success: false, message: "Comment not found" });

    let isLiked = false;

    if (comment.likes.includes(userId)) {
      // Unlike
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);
      comment.likes_count = comment.likes.length;
      await comment.save();
      isLiked = false;
    } else {
      // Like
      comment.likes.push(userId);
      comment.likes_count = comment.likes.length;
      await comment.save();
      isLiked = true;
    }

    return res.json({
      success: true,
      message: isLiked ? "Comment liked" : "Comment unliked",
      commentId,
      likes_count: comment.likes_count,
      isLiked
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
