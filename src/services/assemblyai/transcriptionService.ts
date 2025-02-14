import { ASSEMBLYAI_API_KEY } from '../../config/constants';

export async function uploadAudio(audioBlob: Blob): Promise<string> {
  if (!ASSEMBLYAI_API_KEY || ASSEMBLYAI_API_KEY === 'YOUR_ASSEMBLYAI_API_KEY') {
    throw new Error('Please set your AssemblyAI API key in config/constants.ts');
  }

  try {
    const response = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY
      },
      body: audioBlob
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload audio');
    }

    const { upload_url } = await response.json();
    if (!upload_url) {
      throw new Error('No upload URL received');
    }

    return upload_url;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    throw new Error('Failed to upload audio');
  }
}

export async function transcribeAudio(audioUrl: string): Promise<string> {
  if (!ASSEMBLYAI_API_KEY || ASSEMBLYAI_API_KEY === 'YOUR_ASSEMBLYAI_API_KEY') {
    throw new Error('Please set your AssemblyAI API key in config/constants.ts');
  }

  try {
    // Start transcription
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: 'en'
      })
    });

    if (!transcriptResponse.ok) {
      const error = await transcriptResponse.json();
      throw new Error(error.message || 'Transcription request failed');
    }

    const { id } = await transcriptResponse.json();
    if (!id) {
      throw new Error('No transcription ID received');
    }

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    
    while (attempts < maxAttempts) {
      const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
        },
      });

      if (!pollingResponse.ok) {
        const error = await pollingResponse.json();
        throw new Error(error.message || 'Polling failed');
      }

      const transcriptionResult = await pollingResponse.json();

      if (transcriptionResult.status === 'completed') {
        return transcriptionResult.text || 'No transcription text received';
      } else if (transcriptionResult.status === 'error') {
        throw new Error(transcriptionResult.error || 'Transcription failed');
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Transcription timed out');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Transcription failed: ${error.message}`);
    }
    throw new Error('Failed to transcribe audio');
  }
}
