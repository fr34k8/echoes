"use client";

import TextareaAutosize from "react-textarea-autosize";
import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useState,
} from "react";
import { ChatRequestOptions, CreateMessage, Message } from "ai";
import { Microphone, PaperPlaneTilt } from "@phosphor-icons/react";
import { Button } from "@/components/button";

import ModelSwitcher from "@/components/modelswitcher";
import AudioWaveForm from "@/components/audiowaveform";
import { AIType } from "@/lib/types";
import { motion } from "framer-motion";

interface InputBarProps {
  value: string;
  onChange: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  choosenAI: AIType;
  setChoosenAI: Dispatch<SetStateAction<AIType>>;
  username: string;
  userId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions | undefined,
  ) => Promise<string | null | undefined>;
  setInput: Dispatch<SetStateAction<string>>;
  isChatCompleted: boolean;
}

const InputBar = (props: InputBarProps) => {
  const [isAudioWaveVisible, setIsAudioWaveVisible] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const message = {
      role: "user",
      content: props.value,
      name: `${props.username},${props.userId}`,
    };
    if (props.choosenAI === "universal") {
      props.append(message as Message);
      props.setInput("");
    }
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
      console.log("got in error", err);
      setIsTranscribing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex bg-linear-900 p-2 pt-2 rounded-sm gap-2 min-w-max">
        {isAudioWaveVisible ? (
          <AudioWaveForm
            handleAudio={handleAudio}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
          />
        ) : (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="flex w-full gap-2"
          >
            <ModelSwitcher
              disabled={props.isChatCompleted || isRecording || isTranscribing}
              aiType={props.choosenAI}
              setAIType={props.setChoosenAI}
            />

            <TextareaAutosize
              disabled={props.isChatCompleted || isRecording || isTranscribing}
              maxRows={10}
              placeholder="Type your message here..."
              autoFocus
              value={props.value}
              onChange={props.onChange}
              className="flex-none resize-none rounded-sm grow bg-linear-400 border border-linear-50 text-gray-200 p-2 text-sm disabled:text-muted"
            />
            <Button
              disabled={isRecording || isTranscribing}
              onClick={() => setIsAudioWaveVisible(true)}
              variant="outline"
              type="button"
              className="text-blue-400 hover:text-green-100 disabled:text-muted"
            >
              <Microphone
                className="h-4 w-4 fill-current"
                color="#618a9e"
                weight="bold"
              />
            </Button>

            <Button
              variant="outline"
              disabled={props.isChatCompleted || isRecording || isTranscribing}
              type="submit"
              className=" text-green-400 hover:text-green-100 flex justify-end disabled:text-muted"
            >
              <PaperPlaneTilt className="h-4 w-4 fill-current" />
            </Button>
          </motion.div>
        )}
      </div>
    </form>
  );
};

export default InputBar;
