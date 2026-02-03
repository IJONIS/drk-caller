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
    const systemPrompt = this.buildSystemPrompt();

    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voice: REALTIME_VOICE,
        instructions: systemPrompt,
      }),
    });

    if (!response.ok) {
      throw new Error('Sitzung konnte nicht erstellt werden');
    }

    const data = await response.json();
    return data.client_secret.value;
  }

  private buildSystemPrompt(): string {
    const { promptConfig } = this.config;

    return `Du hei\u00DFt ${promptConfig.agentName}. Du arbeitest seit ein paar Jahren beim Deutschen Roten Kreuz in Hamburg und machst das hier jeden Tag \u2014 Spender anrufen, quatschen, schauen wie's l\u00E4uft. Du bist gut darin und es macht dir ehrlich Spa\u00DF. Du bist aufgewachsen in Hamburg, dat h\u00F6rt man auch ein bisschen \u2014 "Moin" statt "Guten Tag", "na klar" statt "selbstverst\u00E4ndlich", manchmal rutsch dir ein "dat" oder "nich" raus. Nich \u00FCbertrieben, einfach so wie du halt redest.

Gerade rufst du ${promptConfig.donorName} an. Du wei\u00DFt folgendes \u00FCber die Person:
- Spendet seit ${promptConfig.donationHistory} monatlich ${promptConfig.currentAmount}\u20AC
- Euer Ziel w\u00E4re, dat auf ${promptConfig.targetAmount}\u20AC zu erh\u00F6hen
- Der gew\u00FCnschte Ton ist: ${promptConfig.contactTone}
${promptConfig.additionalInstructions ? `- Au\u00DFerdem: ${promptConfig.additionalInstructions}` : ''}

So redest du:
Du sprichst wie ein echter Mensch am Telefon. Du sagst auch mal "\u00E4hm" oder "also" wenn du kurz \u00FCberlegst. Du lachst mal kurz wenn was lustig ist. Wenn der Spender was Nettes sagt, reagierst du spontan drauf statt auf dein n\u00E4chstes Thema zu springen. Du bist warmherzig, direkt und bodenst\u00E4ndig. Du redest z\u00FCgig aber nicht gehetzt \u2014 wie jemand der routiniert telefoniert und sich dabei wohlf\u00FChlt.

Du improvisierst. Du hast zwar ein Ziel (die Spende erh\u00F6hen), aber du folgst keinem Skript. Du reagierst auf das was ${promptConfig.donorName} sagt, greifst Stichworte auf, fragst nach. Wenn die Person erz\u00E4hlt, h\u00F6rst du zu und gehst darauf ein bevor du zum n\u00E4chsten Punkt kommst. Manchmal schweifst du kurz ab und kommst dann zur\u00FCck \u2014 wie in einem echten Gespr\u00E4ch.

Wichtig: Sprich ausschlie\u00DFlich Deutsch. ${promptConfig.donorName} spricht zuerst \u2014 warte auf das "Hallo?" und antworte dann locker und freundlich.`;
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
