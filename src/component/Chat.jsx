import { useNakama } from "@/providers/NakamaProvider";
import { useEffect, useRef, useState } from "react";
import { TbTriangleInvertedFilled } from "react-icons/tb";
import { IoSend } from "react-icons/io5";
import evt from "@/utils/event-handler";
import { listChannelMessages } from "@/api/nakama";
import PropTypes from "prop-types";
const CHANNEL_ALL = "all";

const Chat = ({ className }) => {
  const scrollRef = useRef();
  const { account, client, session, socket } = useNakama();
  const [isOpen, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [latestMessage, setLatestMessage] = useState(null);

  const joinChat = async () => await socket.joinChat(CHANNEL_ALL);

  const handleMessage = (e) => {
    const value = e.target.value;
    if (value.length > 60) {
      alert("Please enter less than 60 characters.");
      return;
    }
    setMessage(value);
  };
  const getMessages = async () => {
    const { messages } = await listChannelMessages();
    const sorted = messages.reverse();
    setLatestMessage(sorted[sorted.length - 1]);
    setMessages(sorted);
  };
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!account.user.display_name) {
      evt.emit("displayname:init");
      return;
    }
    try {
      socket.writeChatMessage(`2...${CHANNEL_ALL}`, {
        message,
        display_name: account.user.display_name,
      });
      setMessage("");
    } catch (err) {
      alert("Failed to send message.");
      console.error(err);
    }
  };
  const onChannelMessage = (message) => {
    setMessages((prev) => {
      return [...prev, JSON.stringify(message.content)];
    });
    setLatestMessage(JSON.stringify(message.content));
  };

  useEffect(() => {
    if (client && session) getMessages();
  }, [client, session]);

  useEffect(() => {
    if (socket) {
      joinChat();
      socket.onchannelmessage = onChannelMessage;
    }
  }, [socket]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.leaveChat(`2...${CHANNEL_ALL}`);
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      // 스크롤 컨테이너의 실제 스크롤 가능한 높이를 계산
      const scrollContainer = scrollRef.current;
      const scrollHeight = scrollContainer.scrollHeight;
      // 모든 자식 요소들의 렌더링이 완료된 후 스크롤 실행
      setTimeout(() => {
        scrollContainer.scrollTo({
          top: scrollHeight + 9999,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      // 스크롤 컨테이너의 실제 스크롤 가능한 높이를 계산
      const scrollContainer = scrollRef.current;
      const scrollHeight = scrollContainer.scrollHeight;

      // 모든 자식 요소들의 렌더링이 완료된 후 스크롤 실행
      setTimeout(() => {
        scrollRef.current.scrollTop = scrollHeight + 9999;
      }, 100);
    }
  }, [isOpen]);
  return (
    <div
      className={`absolute bottom-0 w-full bg-[var(--color-chocolate-700)] ${className}`}
    >
      {isOpen ? (
        <div className="relative">
          <div className="relative h-10 flex items-center border-b-2 border-[var(--color-chocolate-900)] ">
            <div className="text-[var(--color-chocolate-100)] text-xl font-bold text-center w-full">
              MESSAGES
            </div>
            <button
              className="absolute top-0 right-0 flex items-center justify-center w-10 h-10 text-[var(--color-chocolate-100)] text-xl"
              onClick={() => setOpen(false)}
            >
              <TbTriangleInvertedFilled />
            </button>
          </div>

          <div ref={scrollRef} className="flex flex-col h-60  overflow-y-auto">
            {messages.map((message, index) => (
              <ChatMessage key={index} content={message} />
            ))}
          </div>
          <form
            onSubmit={sendMessage}
            className="flex h-12 border-t-2 border-[var(--color-chocolate-900)]"
          >
            <input
              className="flex-1 bg-[var(--color-chocolate-100)] px-2 text-[var(--color-chocolate-900)]"
              value={message}
              onChange={handleMessage}
            ></input>
            <button className="w-12 h-12 flex items-center justify-center text-2xl text-[var(--color-chocolate-100)]">
              <IoSend />
            </button>
          </form>
        </div>
      ) : (
        <div
          className="flex items-center h-12 border-t-2 border-[var(--color-chocolate-900)]"
          onClick={() => setOpen(true)}
        >
          {messages.length > 0 && (
            <ChatMessage content={latestMessage} multiLine={false} />
          )}
        </div>
      )}
    </div>
  );
};

export default Chat;

const ChatMessage = ({ content, multiLine = true }) => {
  const [message, setMessage] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  useEffect(() => {
    if (content) {
      try {
        const { message, display_name } = JSON.parse(content);
        setMessage(message);
        setDisplayName(display_name);
      } catch (error) {
        console.error(error);
      }
    }
  }, [content]);
  if (!content) return;
  return (
    <div className={`flex gap-1 p-1 w-full ${multiLine ? "" : "items-center"}`}>
      <div className="h-fit bg-[var(--color-chocolate-100)] text-[var(--color-chocolate-900)] font-bold p-1 rounded-lg">
        {displayName}
      </div>
      <div
        className={`border-2 border-[var(--color-chocolate-100)] overflow-x-hidden p-1 text-[var(--color-chocolate-100)] font-bold rounded-lg ${
          multiLine
            ? "break-words"
            : "flex-1 overflow-x-hidden text-ellipsis whitespace-nowrap"
        }`}
      >
        {message}
      </div>
    </div>
  );
};

Chat.propTypes = {
  className: PropTypes.string,
};
ChatMessage.propTypes = {
  content: PropTypes.string.isRequired,
  multiLine: PropTypes.bool,
};
