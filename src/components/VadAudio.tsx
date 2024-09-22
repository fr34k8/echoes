"use client";

import { useState, useRef, useCallback } from "react";
import { useMicVAD, utils } from "@ricky0123/vad-react";
import { Microphone, StopCircle } from "@phosphor-icons/react";
import { Button } from "@/components/button";

interface VadAudioProps {
  onAudioCapture: (audioFile: File) => void;
  onStartListening: () => void;
  onStopListening: () => void;
}

export default function VadAudio({
  onAudioCapture,
  onStartListening,
  onStopListening,
}: VadAudioProps) {
  const [isListening, setIsListening] = useState(false);
  const audioChunks = useRef<Blob[]>([]);

  const vad = useMicVAD({
    onSpeechEnd: (audio: Float32Array) => {
      const wavBuffer = utils.encodeWAV(audio);
      const audioBlob = new Blob([wavBuffer], { type: "audio/wav" });
      const audioFile = new File([audioBlob], "audio.wav", {
        type: "audio/wav",
      });
      console.log("audioFile", audioFile);

      onAudioCapture(audioFile);
    },
    workletURL: "/vad/vad.worklet.bundle.min.js",
    modelURL: "/vad/silero_vad.onnx",
    ortConfig: (ort) => {
      ort.env.wasm.wasmPaths = "/vad/";
    },
    startOnLoad: false,
  });

  const handleStartListening = useCallback(() => {
    vad.start();
    onStartListening();
    setIsListening(true);
    audioChunks.current = [];
  }, [vad]);
  // console.log("vad.start()", vad.errored, vad.loading, vad.userSpeaking, vad.listening);

  const handleStopListening = useCallback(() => {
    setIsListening(false);
    onStopListening();
    vad.pause();
  }, [vad]);

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={vad.listening ? handleStopListening : handleStartListening}
        size="icon"
        variant="secondary"
        type="button"
        className="disabled:text-muted"
      >
        {vad.listening ? (
          <StopCircle
            className="h-4 w-4 fill-current"
            color="#618a9e"
            weight="bold"
          />
        ) : (
          <Microphone
            className="h-4 w-4 fill-current"
            color="#618a9e"
            weight="bold"
          />
        )}
      </Button>
    </div>
  );
}
