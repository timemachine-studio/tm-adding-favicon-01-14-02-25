import { useState, useCallback, useRef } from 'react';
import RecordRTC from 'recordrtc';
import { uploadAudio, transcribeAudio } from '../services/assemblyai/transcriptionService';

export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false
      });

      streamRef.current = stream;
      const recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/webm',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
        timeSlice: 1000,
      });

      recorder.startRecording();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start recording';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const recorder = recorderRef.current;
      const stream = streamRef.current;

      if (!recorder || !stream) {
        const error = 'No active recording found';
        setError(error);
        reject(new Error(error));
        return;
      }

      try {
        recorder.stopRecording(async () => {
          try {
            setError(null);
            const blob = await recorder.getBlob();
            
            if (blob.size === 0) {
              throw new Error('No audio data recorded');
            }

            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
            
            // Clean up recorder
            recorder.destroy();
            recorderRef.current = null;
            streamRef.current = null;
            setIsRecording(false);

            // Process audio
            const audioUrl = await uploadAudio(blob);
            const transcription = await transcribeAudio(audioUrl);
            
            resolve(transcription);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to process recording';
            setError(message);
            reject(new Error(message));
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to stop recording';
        setError(message);
        reject(new Error(message));
      }
    });
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    error
  };
}
