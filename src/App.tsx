import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LaunchpadGrid } from "@/components/LaunchpadGrid";
import { useMidi } from "@/hooks/useMidi";
import { useAudio } from "@/hooks/useAudio";
import { randomCssColor } from "@/lib/midi-utils";

interface PadState {
  color: string;
}

function App() {
  const [activePads, setActivePads] = useState<Map<number, PadState>>(new Map());
  const { playNote, stopNote, resumeContext } = useAudio();

  const handleNoteOn = useCallback(
    (note: number) => {
      playNote(note);
      sendLedOnRef.current(note);
      setActivePads((prev) => {
        const next = new Map(prev);
        next.set(note, { color: randomCssColor() });
        return next;
      });
    },
    [playNote]
  );

  const handleNoteOff = useCallback(
    (note: number) => {
      stopNote(note);
      sendLedOffRef.current(note);
      setActivePads((prev) => {
        const next = new Map(prev);
        next.delete(note);
        return next;
      });
    },
    [stopNote]
  );

  const { status, connect, sendLedOn, sendLedOff } = useMidi({
    onNoteOn: handleNoteOn,
    onNoteOff: handleNoteOff,
  });

  // Store refs to avoid circular dependency
  const sendLedOnRef = { current: sendLedOn };
  const sendLedOffRef = { current: sendLedOff };

  const handleConnect = useCallback(() => {
    resumeContext();
    connect();
  }, [resumeContext, connect]);

  const handlePadOn = useCallback(
    (note: number) => {
      resumeContext();
      handleNoteOn(note);
    },
    [resumeContext, handleNoteOn]
  );

  const statusLabel: Record<string, string> = {
    disconnected: "未接続",
    connecting: "接続中...",
    connected: "接続済み",
    unsupported: "非対応",
  };

  const statusVariant = status === "connected"
    ? ("default" as const)
    : status === "unsupported"
    ? ("destructive" as const)
    : ("secondary" as const);

  return (
    <div
      className="min-h-svh flex flex-col items-center justify-center p-4 gap-6"
      onPointerDown={resumeContext}
    >
      <div className="w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">MIDI Kids</h1>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant}>{statusLabel[status]}</Badge>
            {status !== "unsupported" && status !== "connected" && (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={status === "connecting"}
              >
                MIDI接続
              </Button>
            )}
          </div>
        </div>

        <LaunchpadGrid
          activePads={activePads}
          onPadOn={handlePadOn}
          onPadOff={handleNoteOff}
        />

        {status === "unsupported" && (
          <p className="text-sm text-muted-foreground text-center">
            このブラウザはWebMIDI APIに対応していません。Chrome/Edgeをお使いください。
            <br />
            画面のパッドをタップして音を鳴らすことはできます。
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
