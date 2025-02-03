import React, { useState } from "react";
import axios from "axios";
import "./index.css"; // Import the custom CSS
import { chatWithChatGPT, uploadImg } from "../../../apicalls/chat";
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

      // Step 1: Upload the image to the server (if an image is selected)
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const data = await uploadImg(formData);

        if (data?.success) {
          imageUrl = data.url; // Extract the S3 URL
          console.log("Image URL: ", imageUrl);
        } else {
          throw new Error("Image upload failed");
        }
      }

      // Step 2: Construct the ChatGPT message payload
      const userMessage = imageUrl
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

      // Step 3: Send the payload to ChatGPT
      const chatPayload = { messages: updatedMessages };

      const chatRes = await chatWithChatGPT(chatPayload);

      const apiResponse = chatRes?.data;
      console.log("API Response: ", apiResponse);

      // Step 4: Append the assistant's response to the conversation
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: apiResponse },
      ]);

      setImageFile(null);
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

  return (
    <div className="chat-container">
      {/* Chat messages */}
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.role === "user" ? "user-message" : "assistant-message"
            }`}
          >
            <>
              {msg.role === "assistant" ? (
                <>
                  {msg?.content ? (
                    <ContentRenderer text={msg.content} />
                  ) : (
                    <p>Unable to get a response from AI</p>
                  )}
                </>
              ) : (
                <>
                  {typeof msg.content === "string"
                    ? msg.content
                    : msg.content.map((item, idx) =>
                        item.type === "text" ? (
                          <p key={idx}>{item.text}</p>
                        ) : (
                          <img
                            key={idx}
                            src={item.image_url.url}
                            alt="User content"
                            style={{ height: "100px" }}
                          />
                        )
                      )}
                </>
              )}
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
          onChange={(e) => setImageFile(e.target.files[0])}
          style={{ width: "200px", borderRadius: "5px", marginRight: "10px" }}
        />
        <button
          disabled={isLoading}
          className="send-button"
          onClick={handleChat}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatGPTIntegration;
