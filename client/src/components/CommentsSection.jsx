// components/CommentsSection.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchComments,
  addComment,
  likeComment,
} from "../features/comments/commentSlice";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import {
  Heart,
  MessageCircle,
  SendHorizonal,
  ChevronDown,
  ChevronUp,
  Reply,
} from "lucide-react";

const CommentsSection = ({ postId }) => {
  const { comments, loading } = useSelector((state) => state.comments);
  const currentUser = useSelector((state) => state.user.value);
  const dispatch = useDispatch();
  const { getToken, userId } = useAuth();

  const [newComment, setNewComment] = useState("");
  const [replyContents, setReplyContents] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [sortBy, setSortBy] = useState("newest");
  const [localLikes, setLocalLikes] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadComments = async () => {
      dispatch(fetchComments({ postId, token: await getToken() }));
    };
    loadComments();
  }, [dispatch, postId, getToken, refreshTrigger]);

  useEffect(() => {
    if (comments.length > 0) {
      const initialLikesState = {};
      const processComments = (commentList) => {
        commentList.forEach((comment) => {
          const isLiked =
            comment.likes && comment.likes.includes(currentUser._id || userId);
          initialLikesState[comment._id] = isLiked;
          
          // Process replies for likes too
          if (comment.replies && comment.replies.length > 0) {
            comment.replies.forEach(reply => {
              const isReplyLiked = 
                reply.likes && reply.likes.includes(currentUser._id || userId);
              initialLikesState[reply._id] = isReplyLiked;
            });
          }
        });
      };

      processComments(comments);
      setLocalLikes(initialLikesState);
    }
  }, [comments, currentUser._id, userId]);

  const handleAddComment = async (parentComment = null) => {
    const content = parentComment
      ? replyContents[parentComment] || ""
      : newComment;

    if (!content.trim()) return toast.error("Comment cannot be empty!");

    try {
      await dispatch(
        addComment({
          postId,
          content: content,
          parentComment,
          token: await getToken(),
        })
      ).unwrap();

      // Refresh comments after successful addition
      setRefreshTrigger(prev => prev + 1);
      
      if (parentComment) {
        // Auto-expand the replies section when adding a reply
        setExpandedReplies(prev => ({
          ...prev,
          [parentComment]: true
        }));
        
        setReplyContents((prev) => ({
          ...prev,
          [parentComment]: "",
        }));
        setReplyingTo(null);
      } else {
        setNewComment("");
      }
      
      toast.success(parentComment ? "Reply added!" : "Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleLikeComment = async (commentId) => {
    const userIdentifier = currentUser._id || userId;
    if (!userIdentifier) {
      toast.error("You need to be logged in to like comments");
      return;
    }

    const currentlyLiked = localLikes[commentId] || false;

    setLocalLikes((prev) => ({
      ...prev,
      [commentId]: !currentlyLiked,
    }));

    dispatch({
      type: "comments/updateLikeOptimistic",
      payload: {
        commentId,
        userId: userIdentifier,
        like: !currentlyLiked,
      },
    });

    try {
      await dispatch(
        likeComment({ commentId, token: await getToken() })
      ).unwrap();
    } catch (error) {
      setLocalLikes((prev) => ({
        ...prev,
        [commentId]: currentlyLiked,
      }));

      dispatch({
        type: "comments/updateLikeOptimistic",
        payload: {
          commentId,
          userId: userIdentifier,
          like: currentlyLiked,
        },
      });

      toast.error("Failed to update like");
    }
  };

  const handleReplyChange = (commentId, value) => {
    setReplyContents((prev) => ({
      ...prev,
      [commentId]: value,
    }));
  };

  const isLikedByUser = (comment) => {
    if (localLikes[comment._id] !== undefined) {
      return localLikes[comment._id];
    }
    return comment.likes && comment.likes.includes(currentUser._id || userId);
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  // Sort comments based on selected criteria
  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === "popular") {
      return (b.likes?.length || 0) - (a.likes?.length || 0);
    }
    return 0;
  });

  // Sort replies in chronological order (oldest first for better conversation flow)
  const getSortedReplies = (replies) => {
    return [...replies].sort((a, b) => {
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>

        {comments.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most liked</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Add Comment */}
      <div className="flex items-center gap-3 mb-6">
        <img
          src={currentUser.profile_picture}
          alt="me"
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
        <div className="flex-1 relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={`Comment as ${currentUser.username}...`}
            className="w-full border rounded-full px-4 py-2.5 text-sm pr-12"
            onKeyPress={(e) => {
              if (e.key === "Enter" && !replyingTo) {
                handleAddComment();
              }
            }}
          />
          <button
            onClick={() => handleAddComment()}
            disabled={!newComment.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-indigo-600 hover:text-purple-600 transition disabled:opacity-40"
          >
            <SendHorizonal size={18} />
          </button>
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse text-gray-500">Loading comments...</div>
        </div>
      ) : sortedComments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle size={48} className="mx-auto mb-2 text-gray-300" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedComments.map((comment) => {
            const hasReplies = comment.replies && comment.replies.length > 0;
            const isExpanded = expandedReplies[comment._id];
            const isLiked = isLikedByUser(comment);
            const replyContent = replyContents[comment._id] || "";
            
            // Get sorted replies (oldest first for conversation flow)
            const sortedReplies = hasReplies ? getSortedReplies(comment.replies) : [];
            
            return (
              <div key={comment._id} className="mt-4">
                <div className="flex gap-3">
                  <img
                    src={comment.user.profile_picture}
                    alt={comment.user.username}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-100 rounded-2xl px-4 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          {comment.user.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-800 mt-1">{comment.content}</p>
                    </div>

                    <div className="flex items-center gap-4 mt-2 ml-2 text-sm text-gray-500">
                      <button
                        onClick={() => handleLikeComment(comment._id)}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      >
                        <Heart
                          size={16}
                          className={`${
                            isLiked ? "text-red-500 fill-red-500" : "text-gray-400"
                          }`}
                        />
                        <span>{comment.likes?.length || 0}</span>
                      </button>

                      <button
                        onClick={() => {
                          setReplyingTo(
                            replyingTo === comment._id ? null : comment._id
                          );
                          if (
                            !replyContents[comment._id] &&
                            replyingTo !== comment._id
                          ) {
                            handleReplyChange(comment._id, "");
                          }
                        }}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        <Reply size={16} />
                        <span>Reply</span>
                      </button>

                      {hasReplies && (
                        <button
                          onClick={() => toggleReplies(comment._id)}
                          className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                          <span>
                            {comment.replies.length}{" "}
                            {comment.replies.length === 1 ? "reply" : "replies"}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Reply input */}
                    {replyingTo === comment._id && (
                      <div className="flex items-center gap-2 mt-3">
                        <img
                          src={currentUser.profile_picture}
                          alt="me"
                          className="w-8 h-8 rounded-full"
                        />
                        <input
                          type="text"
                          value={replyContent}
                          onChange={(e) => handleReplyChange(comment._id, e.target.value)}
                          className="flex-1 border rounded-full px-4 py-2 text-sm"
                          placeholder={`Reply as ${currentUser.username}...`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddComment(comment._id);
                            }
                          }}
                          autoFocus
                        />

                        <button
                          onClick={() => handleAddComment(comment._id)}
                          className="p-2 text-indigo-600 hover:text-purple-600 transition"
                        >
                          <SendHorizonal size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Show replies if expanded - in chronological order */}
                {hasReplies && isExpanded && (
                  <div className="mt-3 ml-12 space-y-3">
                    {sortedReplies.map((reply) => {
                      const isReplyLiked = isLikedByUser(reply);
                      
                      return (
                        <div key={reply._id} className="flex gap-3">
                          <img
                            src={reply.user.profile_picture}
                            alt={reply.user.username}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="bg-gray-100 rounded-2xl px-4 py-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm">
                                  {reply.user.username}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(reply.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-800 mt-1">{reply.content}</p>
                            </div>

                            <div className="flex items-center gap-4 mt-2 ml-2 text-sm text-gray-500">
                              <button
                                onClick={() => handleLikeComment(reply._id)}
                                className="flex items-center gap-1 hover:text-red-500 transition-colors"
                              >
                                <Heart
                                  size={16}
                                  className={`${
                                    isReplyLiked ? "text-red-500 fill-red-500" : "text-gray-400"
                                  }`}
                                />
                                <span>{reply.likes?.length || 0}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;