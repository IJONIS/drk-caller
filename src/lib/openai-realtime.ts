import type { PromptConfig } from '../types';

export interface RealtimeConnectionConfig {
  promptConfig: PromptConfig;
  onAgentSpeaking: () => void;
  onAgentFinished: () => void;
  onUserTranscript?: (text: string) => void;
  onError: (error: string) => void;
  onConnectionEstablished: () => void;
}

const REALTIME_MODEL = 'gpt-4o-realtime-preview';
const REALTIME_VOICE = 'coral';

export class OpenAIRealtimeConnection {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mediaStream: MediaStream | null = null;
  private config: RealtimeConnectionConfig;

  constructor(config: RealtimeConnectionConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      const ephemeralKey = await this.fetchEphemeralKey();
      this.setupPeerConnection();
      this.setupAudioPlayback();
      await this.setupMicrophone();
      this.setupDataChannel();
      await this.performSDPExchange(ephemeralKey);
    } catch (error) {
      console.error('WebRTC connection error:', error);
      this.config.onError(
        error instanceof Error ? error.message : 'Verbindung fehlgeschlagen'
      );
    }
  }

  private async fetchEphemeralKey(): Promise<string> {
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voice: REALTIME_VOICE,
        instructions: this.config.promptConfig.systemPrompt,
      }),
    });

    if (!response.ok) {
      throw new Error('Sitzung konnte nicht erstellt werden');
    }

    const data = await response.json();
    return data.client_secret.value;
  }

  private setupPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection();

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('WebRTC connection state:', state);

      if (state === 'failed' || state === 'disconnected') {
        this.config.onError('Verbindung unterbrochen');
      }
    };
  }

  private setupAudioPlayback(): void {
    this.audioElement = document.createElement('audio');
    this.audioElement.autoplay = true;

    this.peerConnection!.ontrack = (event) => {
      this.audioElement!.srcObject = event.streams[0];
    };
  }

  private async setupMicrophone(): Promise<void> {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const audioTrack = this.mediaStream.getTracks()[0];
    this.peerConnection!.addTrack(audioTrack, this.mediaStream);
  }

  private setupDataChannel(): void {
    this.dataChannel = this.peerConnection!.createDataChannel('oai-events');

    this.dataChannel.onopen = () => {
      console.log('Data channel open');
      this.config.onConnectionEstablished();
    };

    this.dataChannel.addEventListener('message', (event) => {
      this.handleMessage(JSON.parse(event.data));
    });
  }

  private async performSDPExchange(ephemeralKey: string): Promise<void> {
    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);

    const sdpResponse = await fetch(
      `https://api.openai.com/v1/realtime?model=${REALTIME_MODEL}`,
      {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
      }
    );

    if (!sdpResponse.ok) {
      throw new Error('SDP-Austausch fehlgeschlagen');
    }

    const answerSdp = await sdpResponse.text();
    await this.peerConnection!.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp,
    });
  }

  private handleMessage(message: Record<string, unknown>): void {
    const messageType = message.type as string;

    switch (messageType) {
      case 'session.created':
        console.log('Session created');
        break;

      case 'response.audio.delta':
        this.config.onAgentSpeaking();
        break;

      case 'response.audio.done':
        this.config.onAgentFinished();
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (this.config.onUserTranscript) {
          this.config.onUserTranscript(message.transcript as string);
        }
        break;

      case 'error':
        console.error('OpenAI error:', message);
        this.config.onError(
          (message.error as Record<string, string>)?.message ||
            'Ein Fehler ist aufgetreten'
        );
        break;

      default:
        console.log('Received event:', messageType);
    }
  }

  disconnect(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}
