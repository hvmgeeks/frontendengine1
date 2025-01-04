import React, { useState } from "react";
import axios from "axios";
import "./index.css"; // Import the custom CSS
import { uploadImg } from "../../../apicalls/image";
import { chatWithChatGPT } from "../../../apicalls/chat";
import ContentRenderer from "./ContentRenderer";

function ChatGPTIntegration() {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChat = async () => {
    if (!prompt.trim() && !imageFile) return;

    setIsLoading(true);

    try {
      let imageUrl = null;

      if (imageFile) {
        const fileBuffer = await imageFile.arrayBuffer();
        const base64Image = btoa(
          new Uint8Array(fileBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
        const mimeType = imageFile.type;
        imageUrl = `data:${mimeType};base64,${base64Image}`;
      }

      const userMessage = imageFile
        ? {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        }
        : { role: "user", content: prompt };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setPrompt("");

      const chatPayload = {
        messages: updatedMessages,
      }

      const chatRes = await chatWithChatGPT(chatPayload);

      const apiResponse = chatRes?.data;

      // Append assistant's response to the conversation
      setMessages((prev) => [...prev, { role: "assistant", content: apiResponse }]);
      setImageFile(null);
      imageUrl = null;
    } catch (error) {
      console.error("Error during chat:", error);
      alert("An error occurred while processing your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleChat(); // Trigger the handleChat function on Enter key
    }
  };

  const text = "To solve the expression \\(9 - 3 \\div \\frac{1}{3} + 1\\), follow the order of operations (PEMDAS/BODMAS):\n\n1. **Division**:  \n   \\(3 \\div \\frac{1}{3} = 3 \\times 3 = 9\\)\n\n2. **Subtraction and Addition**:  \n   \\(9 - 9 + 1 = 0 + 1 = 1\\)\n\nSo, the answer is \\(1\\).";

  return (
    <div className="chat-container">
      {/* Chat messages */}
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.role === "user" ? "user-message" : "assistant-message"}`}
          >
            <>
              {msg.role === 'assistant' ?
                <>
                  <ContentRenderer text={msg.content} />
                </>
                :
                <>
                  {typeof msg.content === "string"
                    ? msg.content
                    : msg.content.map((item, idx) =>
                      item.type === "text" ? (
                        <p key={idx}>{item.text}</p>
                      ) : (
                        <img key={idx} src={item.image_url.url} alt="User content" style={{ height: "100px" }} />
                      )
                    )}
                </>
              }
            </>
          </div>
        ))}
        {isLoading && <div className="loading-indicator">Loading...</div>}
      </div>

      {/* Input and upload */}
      <div className="chat-input-container">
        <textarea
          className="chat-input"
          placeholder="Type your message here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        ></textarea>
        <input
          type="file"
          accept="image/*"
          // id="file-upload"
          onKeyDown={handleKeyPress}
          onChange={(e) => setImageFile(e.target.files[0])}
          // style={{ display: "none" }}
          style={{ width: "200px", borderRadius: "5px", marginRight: "10px" }}
        />
        {/* <button>
          <label htmlFor="file-upload" className="upload-button">
            Upload Image
          </label>
        </button> */}
        <button disabled={isLoading} className="send-button" onClick={handleChat}>
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatGPTIntegration;
