"use client";

import TextareaAutosize from "react-textarea-autosize";
import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { ChatRequestOptions, CreateMessage, Message, nanoid } from "ai";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { Button } from "@/components/button";
import { ChatType, chattype } from "@/lib/types";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePresence } from "ably/react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import z from "zod";
import { toast } from "./ui/use-toast";
import usePreferences from "@/store/userPreferences";
import { useImageState } from "@/store/tlDrawImage";
import ModelSwitcher from "./modelswitcher";
import VadAudio from "./vadAudio";
const isValidImageType = (value: string) =>
  /^image\/(jpeg|png|jpg|webp)$/.test(value);

const Schema = z.object({
  imageName: z.any(),
  imageType: z.string().refine(isValidImageType, {
    message: "File type must be JPEG, PNG, or WEBP image",
    path: ["type"],
  }),
  imageSize: z.number(),
  value: z.string(),
  userId: z.string(),
  orgId: z.string(),
  chatId: z.any(),
  file: z.instanceof(Blob),
  message: z.array(z.any()),
  id: z.string(),
  chattype: chattype,
});
function isJSON(str: any) {
  let obj: any;
  try {
    obj = JSON.parse(str);
  } catch (e) {
    return false;
  }
  if (typeof obj === "number" || obj instanceof Number) {
    return false;
  }
  return !!obj && typeof obj === "object";
}

interface InputBarProps {
  dropZoneImage: File[];
  value: string;
  onChange: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  username: string;
  userId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions | undefined,
  ) => Promise<string | null | undefined>;
  setInput: Dispatch<SetStateAction<string>>;
  isChatCompleted: boolean;
  chatId: string;
  messages: Message[];
  orgId: string;
  setMessages: (messages: Message[]) => void;
  isLoading: boolean;
  chattype: ChatType;
  setChattype: Dispatch<SetStateAction<ChatType>>;
  setDropzoneActive: Dispatch<SetStateAction<boolean>>;
  dropZoneActive: boolean;
  onClickOpen: any;
  onClickOpenChatSheet: boolean | any;
}

const InputBar = (props: InputBarProps) => {
  const {
    tldrawImageUrl,
    tlDrawImage,
    setTlDrawImage,
    settldrawImageUrl,
    onClickOpenChatSheet,
  } = useImageState();
  const [isAudioWaveVisible, setIsAudioWaveVisible] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [disableInputs, setDisableInputs] = useState<boolean>(false);
  const [isRagLoading, setIsRagLoading] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // const ably = useAbly();

  // console.log(
  //   "ably",
  //   ably.channels
  //     .get(`channel_${props.chatId}`)
  //     .presence.get({ clientId: `room_${props.chatId}` }),
  // );

  // const { presenceData, updateStatus } = usePresence(`channel_${props.chatId}`);
  const preferences = usePreferences();
  const { presenceData, updateStatus } = usePresence(
    `channel_${props.chatId}`,
    {
      id: props.userId,
      username: props.username,
      isTyping: false,
    },
  );
  // using local state for development purposes

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("props.value", props.value);
    if (props.value.trim() === "") {
      return;
    }
    const ID = nanoid();
    const message: Message = {
      id: ID,
      role: "user",
      content: props.value,
      name: `${props.username},${props.userId}`,
      audio: "",
    };
    if (props.dropZoneActive) {
      setDisableInputs(true);
      setIsRagLoading(true);

      console.log("image dropped");
      props.setInput("");
      props.setDropzoneActive(false);

      if (props.dropZoneImage && props.dropZoneImage.length > 0) {
        const zodMessage: any = Schema.safeParse({
          imageName: props.dropZoneImage[0].name,
          imageType: props.dropZoneImage[0].type,
          imageSize: props.dropZoneImage[0].size,
          file: props.dropZoneImage[0],
          value: props.value,
          userId: props.userId,
          orgId: props.orgId,
          chatId: props.chatId,
          message: [...props.messages, message],
          id: ID,
          chattype: props.chattype,
        });
        const imageExtension = props.dropZoneImage[0].name.substring(
          props.dropZoneImage[0].name.lastIndexOf(".") + 1,
        );
        // console.log("zodmessage", zodMessage);
        // console.log("dropzone", props.dropZoneActive);
        if (zodMessage.success) {
          const file = props.dropZoneImage[0];
          const zodMSG = JSON.stringify(zodMessage);
          const formData = new FormData();
          formData.append("zodMessage", zodMSG);
          formData.append("file", file);
          const response = await fetch("/api/imageInput", {
            method: "POST",
            body: formData,
          });
          if (response) {
            console.log("responce", response);
            let assistantMsg = "";
            const reader = response.body?.getReader();
            console.log("reader", reader);
            const decoder = new TextDecoder();
            let charsReceived = 0;
            let content = "";
            reader
              ?.read()
              .then(async function processText({ done, value }) {
                if (done) {
                  settldrawImageUrl("");
                  setTlDrawImage("");
                  setDisableInputs(false);
                  setIsRagLoading(false);
                  console.log("Stream complete");
                  return;
                }
                charsReceived += value.length;
                const chunk = decoder.decode(value, { stream: true });
                assistantMsg += chunk === "" ? `${chunk} \n` : chunk;
                content += chunk === "" ? `${chunk} \n` : chunk;
                // console.log("assistMsg", assistantMsg);
                props.setMessages([
                  ...props.messages,
                  awsImageMessage,
                  message,
                  {
                    ...assistantMessage,
                    content: assistantMsg,
                  },
                ]);
                reader.read().then(processText);
              })
              .then((e) => {
                console.error("error", e);
              });
            const awsImageMessage = {
              role: "user",
              subRole: "input-image",
              content: `${process.env.NEXT_PUBLIC_IMAGE_PREFIX_URL}imagefolder/${props.chatId}/${ID}.${imageExtension}`,
              id: ID,
            } as Message;
            const assistantMessage: Message = {
              id: ID,
              role: "assistant",
              content: content,
            };
          } else {
            console.error(" Response Error :", response);
          }
        } else {
          toast({
            description: (
              <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                <code className="text-white">
                  {zodMessage.error.issues[0].message}
                </code>
              </pre>
            ),
          });
        }
      }
      return;
    }

    if (props.chattype === "rag") {
      setIsRagLoading(true);
      setDisableInputs(true);
      props.setMessages([...props.messages, message]);
      props.setInput("");
      let content = "";
      const id = nanoid();
      const assistantMessage: Message = {
        id,
        role: "assistant",
        content: "",
      };
      let message2 = "";
      try {
        await fetchEventSource(`/api/chatmodel/${props.chatId}}`, {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            input: props.value,
            messages: [...props.messages, message],
            userId: props.userId,
            orgId: props.orgId,
            chattype: props.chattype,
            enableStreaming: true,
          }),
          openWhenHidden: true,
          async onopen(response) {
            setDisableInputs(true);
            console.log("events started");
          },
          async onclose() {
            setDisableInputs(false);
            setIsRagLoading(false);
            console.log("event reading closed", message2);
            fetch(`/api/updatedb/${props.chatId}`, {
              method: "POST",
              body: JSON.stringify({
                messages: [
                  ...props.messages,
                  message,
                  {
                    ...assistantMessage,
                    content: content,
                  },
                ],
                orgId: props.orgId,
                usreId: props.userId,
              }),
            }); // TODO: handle echoes is typing
            return;
          },
          async onmessage(event: any) {
            if (event.data !== "[END]" && event.event !== "function_call") {
              message2 += event.data === "" ? `${event.data} \n` : event.data;
              content += event.data === "" ? `${event.data} \n` : event.data;
              props.setMessages([
                ...props.messages,
                message,
                {
                  ...assistantMessage,
                  content: content,
                },
              ]);
            }
          },
          onerror(error: any) {
            console.error("event reading error", error);
          },
        });
        return;
      } catch (error) {
        console.error(error);
        return;
      }
    }
    // if (props.choosenAI === "universal") {
    props.append(message as Message);
    props.setInput("");
    // }
    // if (props.choosenAI === "agent") {
    //   setDisableInputs(true);
    //   props.setMessages([...props.messages, message]);
    //   props.setInput("");
    //   const res = await fetch(`/api/chatagent/${props.chatId}`, {
    //     method: "POST",
    //     body: JSON.stringify({
    //       messages: [...props.messages, message],
    //       isFast: true,
    //       orgId: props.orgId,
    //     }),
    //   });
    //   let content = "";
    //   const id = nanoid();
    //   const assistantMessage: Message = {
    //     id,
    //     role: "assistant",
    //     content: "",
    //   };
    //   let functionMessages: Message[] = [];
    //   if (res.body) {
    //     const reader = res?.body.getReader();
    //     while (true) {
    //       const { done, value } = await reader.read();
    //       if (done) {
    //         console.log("controller closed");
    //         setDisableInputs(false);
    //         break;
    //       }
    //       const text = new TextDecoder().decode(value);
    //       if (text.startsWith(`$__JSON_START__`)) {
    //         const jsonStr = text
    //           .replace("$__JSON_START__", "")
    //           .replace("__JSON_END__", "");
    //         if (isJSON(jsonStr)) {
    //           console.log("this is json", jsonStr);
    //           const functionMessage: Message = {
    //             id: nanoid(),
    //             role: "function",
    //             content: jsonStr,
    //           };
    //           functionMessages.push(functionMessage);
    //           props.setMessages([
    //             ...props.messages,
    //             message,
    //             ...functionMessages,
    //           ]);
    //         }
    //       } else {
    //         console.log("non-json", text);
    //         content += text;
    //         props.setMessages([
    //           ...props.messages,
    //           message,
    //           ...functionMessages,
    //           {
    //             ...assistantMessage,
    //             content: content,
    //           },
    //         ]);
    //       }
    //     }
    //   }
    // }
  };

  const handleAudio = async (audioFile: File) => {
    setIsAudioWaveVisible(false);
    setIsTranscribing(true);
    const f = new FormData();
    f.append("file", audioFile);
    // Buffer.from(audioFile)
    console.log(audioFile);
    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        body: f,
      });

      // console.log('data', await data.json());
      const data = await res.json();
      console.log("got the data", data);
      props.setInput(data.text);
      setIsTranscribing(false);
    } catch (err) {
      console.error("got in error", err);
      setIsTranscribing(false);
    }
  };
  const handleAudioChunk = async (audioChunk: File) => {
    setIsTranscribing(true);
    const f = new FormData();
    f.append("file", audioChunk);
    console.log(audioChunk);
    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        body: f,
      });

      const data = await res.json();
      console.log("got the data", data);
      props.setInput((prev) => prev + data.text);
      setIsTranscribing(false);
    } catch (err) {
      console.error("got in error", err);
      setIsTranscribing(false);
    }
  };

  useEffect(() => {
    if (
      presenceData
        .filter((p) => p.data.id !== props.userId)
        .some((p) => p.data.isTyping)
    ) {
      if (!disableInputs) {
        setDisableInputs(true);
      }
    } else {
      if (disableInputs) {
        setDisableInputs(false);
        queryClient.invalidateQueries(["chats", props.chatId]);
      }
    }
  }, [presenceData]);
  useEffect(() => {
    if (!props.isLoading && !isRagLoading) {
      const timer = setTimeout(() => {
        updateStatus({
          isTyping: false,
          username: `${props.username} is typing...`,
          id: props.userId,
        });
        // setDisableInputs(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [props.value]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    let countdown = 60;

    if (props.isLoading || isRagLoading) {
      timer = setInterval(() => {
        if (countdown > 0) {
          updateStatus({
            isTyping: true,
            username: `Echoes is thinking (${countdown--} secs)`,
            id: props.userId,
          });
        } else {
          clearInterval(timer);
          if (props.isLoading) {
            updateStatus({
              isTyping: true,
              username:
                "It's taking longer than expected. Please keep patience",
              id: props.userId,
            });
          }
        }
      }, 1000); // 1 second interval
    } else {
      if (timer) {
        clearInterval(timer);
      }
      updateStatus({
        isTyping: false,
        username: "Echoes",
        id: props.userId,
      });
    }

    return () => clearInterval(timer);
  }, [props.isLoading, isRagLoading]);
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (props.dropZoneActive) {
      props.setInput(e.target.value);
    } else {
      const inputValue = e.target.value;
      navigator.clipboard
        .writeText(inputValue)
        .then(() => {
          console.log("Input value copied to clipboard");
        })
        .catch((err) => {
          console.error("Could not copy text: ", err);
        });
      props.onChange(e);
    }
    updateStatus({
      isTyping: true,
      username: props.username,
      id: props.userId,
    });
    // setDisableInputs(true)
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-grow sm:min-w-[${
        onClickOpenChatSheet ? "395px" : "700px"
      }]`}
    >
      <motion.div
        layout
        className="flex flex-grow bg-linear-900 p-2 pt-2 rounded-sm gap-2 "
      >
        {/* <AnimatePresence> */}
        <motion.div layout className="flex flex-grow w-full gap-2">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1, transition: { duration: 0.5 } }}
            exit={{ x: -50, opacity: 0, transition: { duration: 0.5 } }}
          >
            <ModelSwitcher
              disabled={
                props.isChatCompleted ||
                isRecording ||
                isTranscribing ||
                disableInputs
              }
              chattype={props.chattype}
              setChatType={props.setChattype}
            />
            {/* <Button
                // disabled={isRecording || isTranscribing || disableInputs}
                disabled={true}
                onClick={props.onClickOpen}
                size="icon"
                variant="secondary"
                type="button"
                className="disabled:text-muted"
              >
                <UploadSimple
                  className="h-4 w-4 fill-current"
                  color="#618a9e"
                  weight="bold"
                />
              </Button> */}
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { duration: 0.5 } }}
            exit={{ y: 50, opacity: 0, transition: { duration: 0.5 } }}
            className="relative w-full"
          >
            {presenceData.some((p) => p.data.isTyping) && (
              <div className="flex items-center absolute top-[-120%] left-[50%] translate-x-[-50%] h-full z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                <div className="flex items-center justify-center gap-4 h-8 ">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                  <p className="">
                    <span className="text-foreground">
                      {presenceData.map((p) => p.data.username).join(", ")}
                    </span>{" "}
                  </p>
                </div>
              </div>
            )}
            <TextareaAutosize
              disabled={
                props.isChatCompleted ||
                isRecording ||
                isTranscribing ||
                disableInputs
              }
              maxRows={10}
              placeholder={
                isTranscribing
                  ? ""
                  : props.dropZoneActive
                  ? "Ask question about image"
                  : "Type your message here..."
              }
              autoFocus
              value={props.value}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
                }
              }}
              className="flex-none resize-none rounded-sm grow w-full bg-background border border-secondary text-primary p-2 text-sm disabled:text-muted"
            />
            <Loader2
              className={cn(
                "h-4 w-4 animate-spin absolute left-2 top-3",
                isTranscribing ? "visible" : "hidden",
              )}
            />
          </motion.div>
          <motion.div
            initial={{ x: 20, y: 25, opacity: 0 }}
            animate={{
              x: 0,
              y: 0,
              opacity: 1,
              transition: { duration: 0.5 },
            }}
            exit={{ x: 20, y: 25, opacity: 0, transition: { duration: 0.5 } }}
          >
            <VadAudio
              onStartListening={() => {
                setIsAudioWaveVisible(true);
              }}
              onStopListening={() => {
                setIsAudioWaveVisible(false);
              }}
              disabled={isRecording || isTranscribing || disableInputs}
              onAudioCapture={(file: File) => {
                // trigger a call to the backend to transcribe the audio
                handleAudioChunk(file);
              }}
            />
          </motion.div>
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1, transition: { duration: 0.5 } }}
            exit={{ x: 50, opacity: 0, transition: { duration: 0.5 } }}
          >
            <Button
              size="icon"
              variant="secondary"
              disabled={
                props.isChatCompleted ||
                isRecording ||
                isTranscribing ||
                disableInputs
              }
              type="submit"
              className="disabled:text-muted"
            >
              <PaperPlaneTilt className="h-4 w-4 fill-current" />
            </Button>
          </motion.div>
        </motion.div>
        {/* ) */}
        {/* } */}
        {/* </AnimatePresence> */}
      </motion.div>
    </form>
  );
};

export default InputBar;
