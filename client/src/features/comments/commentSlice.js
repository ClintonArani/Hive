// features/comments/commentSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Initial state
const initialState = {
  comments: [],   // list of comments for a post
  loading: false,
};

// Fetch comments for a post
export const fetchComments = createAsyncThunk(
  "comments/fetchComments",
  async ({ postId, token }) => {
    const { data } = await api.get(`/api/comments/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.success ? data.comments : [];
  }
);

// Add a new comment or reply
export const addComment = createAsyncThunk(
  "comments/addComment",
  async ({ postId, content, parentComment, token }) => {
    const { data } = await api.post(
      "/api/comments/add",
      { postId, content, parentComment },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.success ? data.comment : null;
  }
);

// Like/unlike a comment
export const likeComment = createAsyncThunk(
  "comments/likeComment",
  async ({ commentId, token }) => {
    const { data } = await api.post(
      "/api/comments/like",
      { commentId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { commentId, success: data.success, message: data.message };
  }
);

const commentSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    resetComments: (state) => {
      state.comments = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = action.payload;
      })

      // Add comment
      .addCase(addComment.fulfilled, (state, action) => {
        if (action.payload) {
          if (action.payload.parentComment) {
            const parent = state.comments.find(
              (c) => c._id === action.payload.parentComment
            );
            if (parent) {
              parent.replies = [...(parent.replies || []), action.payload];
            }
          } else {
            state.comments = [action.payload, ...state.comments];
          }
        }
      })

      // ✅ Handle like/unlike
      .addCase(likeComment.fulfilled, (state, action) => {
        const { commentId, success, message } = action.payload;
        if (!success) return;

        // Helper function to toggle inside replies too
        const toggleLike = (comment) => {
          if (comment._id === commentId) {
            if (!comment.likes) comment.likes = [];
            if (!comment.likes_count) comment.likes_count = 0;

            const alreadyLiked = comment.likes.includes(state.currentUserId); 
            if (alreadyLiked) {
              comment.likes = comment.likes.filter(
                (id) => id !== state.currentUserId
              );
              comment.likes_count -= 1;
            } else {
              comment.likes.push(state.currentUserId);
              comment.likes_count += 1;
            }
          }
          if (comment.replies && comment.replies.length) {
            comment.replies.forEach(toggleLike);
          }
        };

        state.comments.forEach(toggleLike);
      });
  },
});

export const { resetComments } = commentSlice.actions;
export default commentSlice.reducer;
