import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const RecentMessage = () => {
  const [messages, setMessages] = useState([]);
  const { user } = useUser();
  const { getToken } = useAuth();

  const fetchRecentMessages = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/user/recent-messages", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        // Group messages by sender → latest + unread count
        const groupedMessages = data.messages.reduce((acc, message) => {
          const senderId = message.from_user_id._id;

          if (!acc[senderId]) {
            acc[senderId] = {
              latest: message,
              count: message.seen ? 0 : 1,
            };
          } else {
            // update latest message if newer
            if (
              new Date(message.createdAt) >
              new Date(acc[senderId].latest.createdAt)
            ) {
              acc[senderId].latest = message;
            }
            // increment unread count if not seen
            if (!message.seen) {
              acc[senderId].count += 1;
            }
          }
          return acc;
        }, {});

        // sort messages by latest createdAt
        const sortedMessages = Object.values(groupedMessages).sort(
          (a, b) =>
            new Date(b.latest.createdAt) - new Date(a.latest.createdAt)
        );

        setMessages(sortedMessages);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentMessages();
      const interval = setInterval(fetchRecentMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <div className="bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-xs text-slate-800">
      <h3 className="font-semibold text-slate-800 mb-4">Recent Messages</h3>
      <div className="flex flex-col max-h-56 overflow-y-scroll no-scrollbar">
        {messages.map(({ latest, count }, index) => (
          <Link
            key={index}
            to={`/messages/${latest.from_user_id._id}`}
            className="flex items-start gap-2 py-2 hover:bg-slate-100"
          >
            <img
              src={latest.from_user_id.profile_picture}
              alt={latest.from_user_id.username}
              className="w-8 h-8 rounded-full"
            />
            <div className="w-full">
              <div className="flex justify-between">
                <p className="font-medium">{latest.from_user_id.full_name}</p>
                <p className="text-[10px] text-slate-400">
                  {moment(latest.createdAt).fromNow()}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-slate-500">
                  {latest.text ? latest.text : "Media"}
                </p>
                {count > 0 && (
                  <p className="bg-indigo-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px]">
                    {count}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentMessage;
