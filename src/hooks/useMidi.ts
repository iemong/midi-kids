import { useState, useRef, useCallback } from "react";
import { randomColor } from "@/lib/midi-utils";

type NoteCallback = (note: number, velocity: number) => void;

interface UseMidiOptions {
  onNoteOn?: NoteCallback;
  onNoteOff?: NoteCallback;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "unsupported";

export function useMidi({ onNoteOn, onNoteOff }: UseMidiOptions = {}) {
  const [status, setStatus] = useState<ConnectionStatus>(
    typeof navigator !== "undefined" && "requestMIDIAccess" in navigator
      ? "disconnected"
      : "unsupported"
  );
  const outputRef = useRef<MIDIOutput | null>(null);
  const callbacksRef = useRef({ onNoteOn, onNoteOff });
  callbacksRef.current = { onNoteOn, onNoteOff };

  const handleMidiMessage = useCallback((e: MIDIMessageEvent) => {
    const [status, note, velocity] = e.data!;
    const command = status & 0xf0;

    if (command === 0x90 && velocity > 0) {
      callbacksRef.current.onNoteOn?.(note, velocity);
    } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      callbacksRef.current.onNoteOff?.(note, velocity);
    }
  }, []);

  const connect = useCallback(async () => {
    if (status === "unsupported") return;
    setStatus("connecting");

    try {
      const access = await navigator.requestMIDIAccess();

      let input: MIDIInput | null = null;
      let output: MIDIOutput | null = null;

      for (const entry of access.inputs.values()) {
        if (entry.name?.toLowerCase().includes("launchpad")) {
          input = entry;
          break;
        }
      }
      for (const entry of access.outputs.values()) {
        if (entry.name?.toLowerCase().includes("launchpad")) {
          output = entry;
          break;
        }
      }

      // Fallback: use first available MIDI device
      if (!input) {
        const firstInput = access.inputs.values().next();
        if (!firstInput.done) input = firstInput.value;
      }
      if (!output) {
        const firstOutput = access.outputs.values().next();
        if (!firstOutput.done) output = firstOutput.value;
      }

      if (input) {
        input.onmidimessage = handleMidiMessage;
        outputRef.current = output;
        setStatus("connected");
      } else {
        setStatus("disconnected");
      }
    } catch {
      setStatus("disconnected");
    }
  }, [status, handleMidiMessage]);

  const sendLedOn = useCallback((note: number) => {
    const output = outputRef.current;
    if (!output) return;
    output.send([0x90, note, randomColor()]);
  }, []);

  const sendLedOff = useCallback((note: number) => {
    const output = outputRef.current;
    if (!output) return;
    output.send([0x80, note, 0]);
  }, []);

  return { status, connect, sendLedOn, sendLedOff };
}
