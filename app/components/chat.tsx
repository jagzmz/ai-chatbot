"use client";

import { ToolInvocation } from "ai";
import { CoreToolMessage } from "ai";
import { Message, useChat } from "ai/react";
import { useEffect } from "react";
import { PreviewMessage } from "./previewMessage";

function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage;
  messages: Array<Message>;
}): Array<Message> {
  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          const toolResult = toolMessage.content.find(
            (tool) => tool.toolCallId === toolInvocation.toolCallId,
          );

          if (toolResult) {
            return {
              ...toolInvocation,
              state: 'result',
              result: toolResult.result,
            };
          }

          return toolInvocation;
        }),
      };
    }

    return message;
  });
}

export function convertToUIMessages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: Array<any>,
): Array<Message> {
  return messages.reduce((chatMessages: Array<Message>, message) => {
    if (message.role === 'tool') {
      return addToolMessageToChat({
        toolMessage: message as CoreToolMessage,
        messages: chatMessages,
      });
    }

    let textContent = '';
    const toolInvocations: Array<ToolInvocation> = [];

    if (typeof message.content === 'string') {
      textContent = message.content;
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === 'text') {
          textContent += content.text;
        } else if (content.type === 'tool-call') {
          toolInvocations.push({
            state: 'call',
            toolCallId: content.toolCallId,
            toolName: content.toolName,
            args: content.args,
          });
        }
      }
    }

    chatMessages.push({
      id: message.id,
      role: message.role as Message['role'],
      content: textContent,
      toolInvocations,
    });

    return chatMessages;
  }, []);
}

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    api: "http://localhost:4200/api/sales/chats/19/messages",
    id: "19",
    headers: {
      "x-access-token":
        "xxxxxxx",
    },
  });

  useEffect(() => {
    fetch("http://localhost:4200/api/sales/chats/19/messages", {
      headers: {
        "x-access-token":
          "xxxxxxx",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages(convertToUIMessages(data.data));
      });
  }, []);

  return (
    <div className="flex flex-col w-full max-w-3xl py-24 mx-auto stretch">
      {messages.map((m) => (
        <PreviewMessage key={m.id} message={m} />
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-3xl p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
