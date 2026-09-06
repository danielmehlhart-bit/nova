import { guard, apiKey, privateJSON } from '../guard';
export async function POST(request: Request) {
  const rejected = guard(request, 12);
  if (rejected) return rejected;
  if (!apiKey())
    return privateJSON(
      { error: 'Server voice is not connected. You can still type.' },
      503,
    );
  if (Number(request.headers.get('content-length') || 0) > 2500000)
    return privateJSON({ error: 'Keep voice messages under 30 seconds.' }, 413);
  try {
    const form = await request.formData(),
      file = form.get('audio');
    if (!(file instanceof File) || file.size < 300 || file.size > 2500000)
      return privateJSON(
        { error: 'Please record a short voice message, up to 30 seconds.' },
        400,
      );
    const mime = file.type.split(';')[0];
    if (
      ![
        'audio/webm',
        'audio/mp4',
        'audio/wav',
        'audio/mpeg',
        'video/webm',
        'video/mp4',
        'audio/x-m4a',
      ].includes(mime)
    )
      return privateJSON(
        {
          error:
            'This recording format is not supported. Please use text or another browser.',
        },
        415,
      );
    const upstream = new FormData();
    upstream.set(
      'file',
      file,
      mime.includes('mp4') || mime.includes('m4a')
        ? 'voice.m4a'
        : mime.includes('wav')
          ? 'voice.wav'
          : mime.includes('mpeg')
            ? 'voice.mp3'
            : 'voice.webm',
    );
    upstream.set('model', 'gpt-4o-mini-transcribe');
    upstream.set('language', 'en');
    upstream.set(
      'prompt',
      'NOVA, AURA, Mira, Juno, Sol, Inez, Theo, Ada. Cloudhomes, Living Gardens, Agoras, Wonder Labs, Observatories, Wild Groves, Dream Pods, Memory Houses.',
    );
    const response = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + apiKey() },
        body: upstream,
        signal: AbortSignal.timeout(25000),
      },
    );
    if (!response.ok) {
      const provider = (await response.json().catch(() => ({}))) as {
        error?: {
          code?: string;
          type?: string;
          param?: string;
          message?: string;
        };
      };
      return privateJSON(
        {
          providerStatus: response.status,
          providerCode:
            typeof provider.error?.code === 'string' &&
            /^[a-z_]{1,60}$/.test(provider.error.code)
              ? provider.error.code
              : null,
          error:
            'Voice transcription is unavailable. Please try again or type your message.',
        },
        502,
      );
    }
    const result = (await response.json()) as { text?: string };
    if (!result.text?.trim())
      return privateJSON(
        { error: 'I did not catch any words. Please try again.' },
        422,
      );
    return privateJSON({ text: result.text.trim().slice(0, 600) });
  } catch (error) {
    return privateJSON(
      {
        error:
          'The recording could not be transcribed. Please try again or type.',
        category: error instanceof Error ? error.name : 'UnknownError',
      },
      502,
    );
  }
}
