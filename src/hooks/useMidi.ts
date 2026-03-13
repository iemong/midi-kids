import { useState, useRef, useCallback } from "react";
import { randomColor } from "@/lib/midi-utils";

type NoteCallback = (note: number, velocity: number) => void;
type ControlChangeCallback = (cc: number, value: number) => void;

interface UseMidiOptions {
  onNoteOn?: NoteCallback;
  onNoteOff?: NoteCallback;
  onControlChange?: ControlChangeCallback;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "unsupported";

export function useMidi({ onNoteOn, onNoteOff, onControlChange }: UseMidiOptions = {}) {
  const [status, setStatus] = useState<ConnectionStatus>(
    typeof navigator !== "undefined" && "requestMIDIAccess" in navigator
      ? "disconnected"
      : "unsupported"
  );
  const outputRef = useRef<MIDIOutput | null>(null);
  const callbacksRef = useRef({ onNoteOn, onNoteOff, onControlChange });
  callbacksRef.current = { onNoteOn, onNoteOff, onControlChange };

  const handleMidiMessage = useCallback((e: MIDIMessageEvent) => {
    const data = e.data!;
    const [statusByte, d1, d2] = data;
    const command = statusByte & 0xf0;
    const channel = statusByte & 0x0f;

    // Log all MIDI messages
    console.log(
      `[MIDI] status=0x${statusByte.toString(16)} cmd=0x${command.toString(16)} ch=${channel} data1=${d1} data2=${d2}`,
      `| raw=[${Array.from(data).map((b) => "0x" + b.toString(16).padStart(2, "0")).join(", ")}]`
    );

    if (command === 0x90 && d2 > 0) {
      callbacksRef.current.onNoteOn?.(d1, d2);
    } else if (command === 0x80 || (command === 0x90 && d2 === 0)) {
      callbacksRef.current.onNoteOff?.(d1, d2);
    } else if (command === 0xb0) {
      // Control Change
      callbacksRef.current.onControlChange?.(d1, d2);
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
