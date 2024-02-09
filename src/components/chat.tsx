"use client";
import { useState, useEffect, useCallback } from "react";
import { AIType, ChatType } from "@/lib/types";
import InputBar from "@/components/inputBar";
import { Message, useChat } from "ai/react";
import Startnewchatbutton from "@/components/startnewchatbutton";
import ChatMessageCombinator from "@/components/chatmessagecombinator";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import PersistenceExample from "@/components/tldraw";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "./ui/use-toast";
import { getUserIdList } from "./chatusersavatars";
// import Dropzone from "react-dropzone";
import { useDropzone } from "react-dropzone";

interface ChatProps {
  orgId: string;
  uid: string;
  dbChat: Message[];
  chatId: string;
  username: string;
  org_slug: string;
  chatTitle: string;
  imageUrl: string;
  type: ChatType;
  confidential: number | null;
}

export default function Chat(props: ChatProps) {
  const [choosenAI, setChoosenAI] = useState<AIType>("universal");
  const [isChatCompleted, setIsChatCompleted] = useState<boolean>(false);
  const [calculatedMessages, setCalculatedMessages] = useState<Message[][]>([]);

  const queryClient = useQueryClient();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        // console.log("file", file);
        const formData = new FormData();
        formData.append("file", file);
        console.log("Appended file:", formData.get("file"));
        const response = await fetch("/api/imageInput", {
          method: "POST",
          body: formData,
        });
        console.log("Backend response:", response);
        //   if (response.ok) {
        //     const result = await response.json();
        //     console.log('Backend response:', result);
        //   } else {
        //     console.error('Error:', response);
        //   }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }, []);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    noClick: true,
    noKeyboard: true,
  });

  const chatFetcher = async () => {
    const res = await axios.get(`/api/chats/${props.chatId}`);
    const chats = res.data.chats;
    return chats as Message[];
  };
  const {
    data: chatsData,
    isLoading: isChatsLoading,
    isError,
  } = useQuery({
    queryKey: ["chats", props.chatId],
    queryFn: chatFetcher,
    initialData: props.dbChat,
    refetchOnWindowFocus: false,
  });

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    append,
    setMessages,
    isLoading,
    data,
  } = useChat({
    api: `/api/chatmodel/${props.chatId}`,
    initialMessages: chatsData,
    body: {
      orgId: props.orgId,
      name: props.username,
      userId: props.uid,
      chattype: props.type,
    },
    onError: (error) => {
      console.log("got the error", error);
      setIsChatCompleted(true);
    },
    onResponse(response) {
      console.log("got the response", response);
    },
    onFinish(message) {
      console.log("got the finish", message);
    },
    sendExtraMessageFields: true,
  });

  useEffect(() => {
    let mainArray: Message[][] = [];
    let subarray: Message[] = [];

    // console.log("messages effect triggered", messages);
    if (messages && messages.length) {
      messages.forEach((message, index) => {
        if (message.role === "user") {
          if (index === 0) {
            subarray.push(message as Message);
          } else {
            mainArray.push(subarray);
            subarray = [];
            subarray.push(message as Message);
          }
        } else if (index === messages.length - 1) {
          subarray.push(message as Message);
          mainArray.push(subarray);
        } else {
          subarray.push(message as Message);
        }
      });
      setCalculatedMessages(mainArray);
    }
  }, [messages]);

  const confidentialFetcher = async () => {
    const res = await axios.get(`/api/chats/${props.chatId}/confidential`);
    const confidential = res.data.confidential;
    return confidential as number;
  };

  const { data: confidentiality } = useQuery({
    queryKey: ["confidential", props.chatId],
    queryFn: confidentialFetcher,
    initialData: props.confidential,
    refetchOnWindowFocus: false,
  });

  const userIds = getUserIdList(props.dbChat);

  const {
    mutate: toogleConfidentiality,
    isLoading: isTooglingConfidentiality,
  } = useMutation({
    mutationFn: async ({ confidential }: { confidential: boolean }) => {
      // toogle confidentiality
      const res = await axios.patch(`/api/chats/${props.chatId}/confidential`, {
        confidential,
      });
      return res.data;
    },
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries(["confidential", props.chatId]);
      await queryClient.invalidateQueries(["chatcards"]);
      toast({
        title: data.message,
      });
    },
    onError(error: any) {
      toast({
        title: `${error.response.data.message}`,
      });
    },
  });

  return (
    <div className="flex flex-col gap-1 mx-auto">
      {props.type === "tldraw" ? (
        <div className=" w-[calc(100dvw-40px)] h-[calc(100dvh-128px)]">
          <PersistenceExample
            org_slug={props.org_slug}
            org_id={props.orgId}
            dbChat={props.dbChat}
            username={props.username}
            chatId={props.chatId}
            uid={props.uid}
          />
        </div>
      ) : (
        // {preferences.showSubRoll && <PersistenceExample />}
        <>
          <section onDrop={(acceptedFiles: any) => onDrop(acceptedFiles)}>
            <div
              className="min-h-[400px] max-h-[auto] flex justify-center items-center"
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              <ChatMessageCombinator
                calculatedMessages={calculatedMessages}
                messages={messages}
                chatId={props.chatId}
                orgId={props.orgId}
                name={props.username}
                uid={props.uid}
                setMessages={setMessages}
                chatTitle={props.chatTitle}
                imageUrl={props.imageUrl}
                isChatCompleted={isChatCompleted}
                setIsChatCompleted={setIsChatCompleted}
                append={append}
                isLoading={isLoading}
                shouldShowConfidentialToggler={userIds.includes(props.uid)}
                confidential={confidentiality}
                toogleConfidentiality={toogleConfidentiality}
                isTooglingConfidentiality={isTooglingConfidentiality}
              />
            </div>
          </section>
          {/* </div> */}
          {isChatCompleted && (
            <div>
              <Startnewchatbutton
                org_slug={props.org_slug}
                org_id={props.orgId}
              />
            </div>
          )}
          <InputBar
            chatId={props.chatId}
            orgId={props.orgId}
            messages={messages}
            setMessages={setMessages}
            username={props.username}
            userId={props.uid}
            choosenAI={choosenAI}
            setChoosenAI={setChoosenAI}
            value={input}
            onChange={handleInputChange}
            setInput={setInput}
            append={append}
            isChatCompleted={isChatCompleted}
            isLoading={isLoading}
            chattype={props.type}
          />
        </>
      )}
    </div>
  );
}
