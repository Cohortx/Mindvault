import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { moods, type Mood } from '../lib/types';
import { PenLine, Mic, Square, Play, Pause, Trash2, Save, Loader2 } from 'lucide-react';

interface JournalPadProps {
  onSave: () => void;
  existingEntry?: {
    id: string;
    content: string;
    mood: string | null;
    voice_url: string | null;
  };
  onCancel?: () => void;
}

export function JournalPad({ onSave, existingEntry, onCancel }: JournalPadProps) {
  const { user } = useAuth();
  const [content, setContent] = useState(existingEntry?.content || '');
  const [mood, setMood] = useState<Mood | null>((existingEntry?.mood as Mood) || null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingEntry?.voice_url || null);
  const [saving, setSaving] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }, [isRecording]);

  const playAudio = useCallback(() => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [audioUrl, isPlaying]);

  const deleteAudio = useCallback(() => {
    if (audioUrl && !existingEntry?.voice_url) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setIsPlaying(false);
  }, [audioUrl, existingEntry?.voice_url]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!user || !content.trim()) return;

    setSaving(true);
    try {
      let voiceUrl: string | null = existingEntry?.voice_url || null;

      // Upload new audio if recorded
      if (audioBlob) {
        const fileName = `${user.id}/${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from('journal-audio')
          .upload(fileName, audioBlob);

        if (!uploadError) {
          const { data } = supabase.storage.from('journal-audio').getPublicUrl(fileName);
          voiceUrl = data.publicUrl;
        }
      }

      if (existingEntry) {
        await supabase
          .from('journal_entries')
          .update({
            content: content.trim(),
            mood,
            voice_url: voiceUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingEntry.id);
      } else {
        await supabase.from('journal_entries').insert({
          user_id: user.id,
          content: content.trim(),
          mood,
          voice_url: voiceUrl,
        });
      }

      onSave();
      setContent('');
      setMood(null);
      deleteAudio();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <PenLine className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {existingEntry ? 'Edit Entry' : 'New Journal Entry'}
        </h3>
      </div>

      {/* Mood Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          How are you feeling?
        </label>
        <div className="flex flex-wrap gap-2">
          {moods.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(mood === m.value ? null : m.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                mood === m.value
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="mr-1">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Recording */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Voice Recording
        </label>
        <div className="flex items-center gap-3">
          {!audioUrl ? (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isRecording
                  ? 'bg-red-500 text-white recording-pulse'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop ({formatTime(recordingTime)})
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Record
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={playAudio}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/30 transition-all"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Play
                  </>
                )}
              </button>
              <button
                onClick={deleteAudio}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}
        </div>
      </div>

      {/* Text Entry */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Thoughts
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="input-field min-h-[200px] resize-y font-serif"
          placeholder="Write your thoughts, reflections, or anything on your mind..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!content.trim() || saving}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
