import {configureStore} from '@reduxjs/toolkit'
import userReducer from '../features/user/userSlice.js'
import connectionsReducer from '../features/connections/connectionsSlice.js'
import messagesReducer from '../features/messages/messageSlice.js'
import commentsReducer from '../features/comments/commentSlice.js'

export const store = configureStore({
    reducer: {
        user: userReducer,
        connections: connectionsReducer,
        messages: messagesReducer,
        comments: commentsReducer
    }
})