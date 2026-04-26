"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

const WORK_DURATION = 25 * 60; // 25 minutes
const BREAK_DURATION = 5 * 60;  // 5 minutes

interface PomodoroTimerProps {
  taskId: string;
}

export function PomodoroTimer({ taskId }: PomodoroTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [hasNotificationSupport, setHasNotificationSupport] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load state from localStorage
  useEffect(() => {
    const key = `pomodoro_${taskId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSessionsCompleted(data.sessionsCompleted || 0);
      } catch {
        // Ignore parse errors
      }
    }

    // Check notification support
    setHasNotificationSupport("Notification" in window);

    // Request notification permission if available
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [taskId]);

  // Save sessions to localStorage
  useEffect(() => {
    const key = `pomodoro_${taskId}`;
    localStorage.setItem(key, JSON.stringify({ sessionsCompleted }));
  }, [sessionsCompleted, taskId]);

  // Timer loop
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer complete
          playChime();
          showNotification();
          
          if (!isBreak) {
            // Work session complete
            setSessionsCompleted((s) => s + 1);
            setIsBreak(true);
            return BREAK_DURATION;
          } else {
            // Break complete
            setIsBreak(false);
            return WORK_DURATION;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isBreak]);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function playChime(): void {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // Play a pleasant chime: two notes (high and low)
      const playNote = (freq: number, duration: number, startTime: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = freq;
        osc.type = "sine";

        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Play chime sequence
      playNote(800, 0.2, now);       // High note
      playNote(600, 0.3, now + 0.15); // Low note
    } catch {
      // Gracefully handle audio context errors
    }
  }

  function showNotification(): void {
    if (!hasNotificationSupport) return;

    try {
      const title = isBreak ? "Break Complete!" : "Work Session Complete!";
      const body = isBreak
        ? "Time to get back to work!"
        : `Great work! Take a ${BREAK_DURATION / 60}-minute break.`;

      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%234CAF50'/><text x='50' y='60' font-size='50' fill='white' text-anchor='middle' font-weight='bold'>✓</text></svg>" });
      }
    } catch {
      // Gracefully handle notification errors
    }
  }

  function handleStart(): void {
    setIsRunning(true);
  }

  function handlePause(): void {
    setIsRunning(false);
  }

  function handleReset(): void {
    setIsRunning(false);
    setTimeLeft(isBreak ? BREAK_DURATION : WORK_DURATION);
  }

  return (
    <div className="border border-[--border] bg-[--surface] p-6 mt-6">
      <h2 className="font-display font-bold text-lg text-[--text] mb-4">Pomodoro Timer</h2>

      <div className="flex flex-col items-center gap-4">
        <div className="text-6xl font-mono font-bold text-[--accent] tabular-nums">
          {formatTime(timeLeft)}
        </div>

        <div className="text-sm text-[--text-muted] font-mono">
          {isBreak ? "Break Time" : "Work Time"} • Sessions Completed: {sessionsCompleted}
        </div>

        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleStart}
              aria-label="Start timer"
            >
              Start
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePause}
              aria-label="Pause timer"
            >
              Pause
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            aria-label="Reset timer"
          >
            Reset
          </Button>
        </div>

        {hasNotificationSupport && (
          <p className="text-xs text-[--text-muted] text-center">
            🔔 Notifications enabled
          </p>
        )}
      </div>
    </div>
  );
}
