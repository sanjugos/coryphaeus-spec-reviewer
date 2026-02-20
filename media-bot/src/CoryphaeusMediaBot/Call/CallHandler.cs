using Microsoft.Graph.Communications.Calls;
using Microsoft.Graph.Communications.Calls.Media;
using Microsoft.Graph.Communications.Resources;
using Microsoft.Skype.Bots.Media;
using CoryphaeusMediaBot.Bot;
using CoryphaeusMediaBot.Media;
using CoryphaeusMediaBot.WebSocket;

namespace CoryphaeusMediaBot.Call;

/// <summary>
/// Handles the lifecycle of a single call/meeting, including
/// audio processing, speech recognition, and TTS playback.
/// </summary>
public class CallHandler : IDisposable
{
    private readonly ICall _call;
    private readonly BotMediaConfig _config;
    private readonly SpeechRecognitionService _sttService;
    private readonly SpeechSynthesisService _ttsService;
    private readonly BackendWebSocketClient _wsClient;
    private readonly ILogger _logger;

    private readonly AudioProcessor _audioProcessor;
    private readonly AudioFramePlayer _audioPlayer;
    private bool _disposed;

    public string CallId => _call.Id;
    public string? MeetingId { get; private set; }

    public CallHandler(
        ICall call,
        BotMediaConfig config,
        SpeechRecognitionService sttService,
        SpeechSynthesisService ttsService,
        BackendWebSocketClient wsClient,
        ILogger logger)
    {
        _call = call;
        _config = config;
        _sttService = sttService;
        _ttsService = ttsService;
        _wsClient = wsClient;
        _logger = logger;

        // Extract meeting ID from the call resource
        MeetingId = call.Resource?.ChatInfo?.ThreadId ?? call.Id;

        // Create audio processor (handles inbound audio → STT)
        _audioProcessor = new AudioProcessor(config, sttService, wsClient, MeetingId, logger);

        // Create audio player (handles TTS → outbound audio frames)
        _audioPlayer = new AudioFramePlayer(logger);

        // Subscribe to audio socket events
        var audioSocket = call.GetLocalMediaSession()?.AudioSocket;
        if (audioSocket != null)
        {
            audioSocket.AudioMediaReceived += OnAudioMediaReceived;
        }

        // Subscribe to call state changes
        call.OnUpdated += OnCallUpdated;

        // Register for speak commands from the backend
        _wsClient.OnSpeakCommand += OnSpeakCommand;

        // Notify backend that we joined the meeting
        _wsClient.SendMeetingJoined(MeetingId);

        _logger.LogInformation("CallHandler created for call {CallId}, meeting {MeetingId}", call.Id, MeetingId);
    }

    private void OnAudioMediaReceived(object? sender, AudioMediaReceivedEventArgs args)
    {
        try
        {
            _audioProcessor.ProcessAudioBuffer(args.Buffer);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing audio buffer for call {CallId}", _call.Id);
        }
        finally
        {
            args.Buffer.Dispose();
        }
    }

    private void OnCallUpdated(ICall sender, ResourceEventArgs<Microsoft.Graph.Call> args)
    {
        var state = args.NewResource?.State;
        _logger.LogInformation("Call {CallId} state changed to {State}", _call.Id, state);

        if (state == Microsoft.Graph.CallState.Terminated)
        {
            _wsClient.SendMeetingLeft(MeetingId ?? _call.Id);
        }
    }

    private async void OnSpeakCommand(string meetingId, string text)
    {
        if (meetingId != MeetingId) return;

        try
        {
            _logger.LogInformation("TTS speak for meeting {MeetingId}: {Text}", meetingId, text[..Math.Min(text.Length, 80)]);

            // Synthesize speech to PCM audio
            var pcmAudio = await _ttsService.SynthesizeSpeechAsync(text).ConfigureAwait(false);
            if (pcmAudio == null || pcmAudio.Length == 0)
            {
                _logger.LogWarning("TTS returned empty audio for meeting {MeetingId}", meetingId);
                return;
            }

            // Send PCM frames to the meeting audio socket
            var audioSocket = _call.GetLocalMediaSession()?.AudioSocket;
            if (audioSocket != null)
            {
                await _audioPlayer.PlayAudioAsync(audioSocket, pcmAudio).ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during TTS playback for meeting {MeetingId}", meetingId);
        }
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        _wsClient.OnSpeakCommand -= OnSpeakCommand;
        _wsClient.SendMeetingLeft(MeetingId ?? _call.Id);

        _audioProcessor.Dispose();

        var audioSocket = _call.GetLocalMediaSession()?.AudioSocket;
        if (audioSocket != null)
        {
            audioSocket.AudioMediaReceived -= OnAudioMediaReceived;
        }

        _call.OnUpdated -= OnCallUpdated;

        _logger.LogInformation("CallHandler disposed for call {CallId}", _call.Id);
    }
}
