using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.Skype.Bots.Media;
using CoryphaeusMediaBot.Bot;
using CoryphaeusMediaBot.WebSocket;

namespace CoryphaeusMediaBot.Media;

/// <summary>
/// Processes inbound audio frames from the meeting, pushing PCM data
/// to Azure Speech SDK for continuous recognition per participant.
/// </summary>
public class AudioProcessor : IDisposable
{
    private readonly BotMediaConfig _config;
    private readonly SpeechRecognitionService _sttService;
    private readonly BackendWebSocketClient _wsClient;
    private readonly string _meetingId;
    private readonly ILogger _logger;

    // Per-participant speech recognizers (keyed by participant MSI)
    private readonly Dictionary<uint, ParticipantRecognizer> _recognizers = new();
    private bool _disposed;

    public AudioProcessor(
        BotMediaConfig config,
        SpeechRecognitionService sttService,
        BackendWebSocketClient wsClient,
        string meetingId,
        ILogger logger)
    {
        _config = config;
        _sttService = sttService;
        _wsClient = wsClient;
        _meetingId = meetingId;
        _logger = logger;
    }

    /// <summary>
    /// Process an incoming audio buffer, extracting per-participant unmixed audio.
    /// </summary>
    public void ProcessAudioBuffer(AudioMediaBuffer buffer)
    {
        if (_disposed) return;

        var unmixedBuffers = buffer.UnmixedAudioBuffers;
        if (unmixedBuffers == null || unmixedBuffers.Length == 0) return;

        foreach (var unmixed in unmixedBuffers)
        {
            var msi = unmixed.ActiveSpeakerId;
            if (!_recognizers.TryGetValue(msi, out var recognizer))
            {
                recognizer = CreateRecognizer(msi);
                _recognizers[msi] = recognizer;
            }

            // Push the raw PCM data to the speech recognizer's push stream
            var data = new byte[unmixed.Length];
            MarshalHelper.Copy(unmixed.Data, data, 0, (int)unmixed.Length);
            recognizer.PushStream.Write(data);
        }
    }

    private ParticipantRecognizer CreateRecognizer(uint msi)
    {
        _logger.LogInformation("Creating speech recognizer for participant MSI {Msi} in meeting {MeetingId}", msi, _meetingId);

        var pushStream = AudioInputStream.CreatePushStream(
            AudioStreamFormat.GetWaveFormatPCM(16000, 16, 1));

        var audioConfig = AudioConfig.FromStreamInput(pushStream);
        var speechConfig = SpeechConfig.FromSubscription(_config.SpeechKey, _config.SpeechRegion);
        speechConfig.SpeechRecognitionLanguage = "en-US";

        var recognizer = new SpeechRecognizer(speechConfig, audioConfig);

        // Handle recognized speech (final results)
        recognizer.Recognized += (s, e) =>
        {
            if (e.Result.Reason == ResultReason.RecognizedSpeech && !string.IsNullOrWhiteSpace(e.Result.Text))
            {
                _logger.LogDebug("STT final (MSI {Msi}): {Text}", msi, e.Result.Text);
                _wsClient.SendTranscription(_meetingId, msi.ToString(), $"Participant-{msi}", e.Result.Text, isFinal: true);
            }
        };

        // Handle partial recognition (intermediate results)
        recognizer.Recognizing += (s, e) =>
        {
            if (!string.IsNullOrWhiteSpace(e.Result.Text))
            {
                _wsClient.SendTranscription(_meetingId, msi.ToString(), $"Participant-{msi}", e.Result.Text, isFinal: false);
            }
        };

        recognizer.Canceled += (s, e) =>
        {
            _logger.LogWarning("STT canceled for MSI {Msi}: {Reason} - {Details}", msi, e.Reason, e.ErrorDetails);
        };

        // Start continuous recognition
        _ = recognizer.StartContinuousRecognitionAsync();

        return new ParticipantRecognizer(recognizer, pushStream);
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        foreach (var (msi, recognizer) in _recognizers)
        {
            try
            {
                recognizer.Recognizer.StopContinuousRecognitionAsync().Wait(TimeSpan.FromSeconds(5));
                recognizer.PushStream.Close();
                recognizer.Recognizer.Dispose();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disposing recognizer for MSI {Msi}", msi);
            }
        }
        _recognizers.Clear();
    }

    private record ParticipantRecognizer(SpeechRecognizer Recognizer, PushAudioInputStream PushStream);
}

// Marshal helper for copying unmanaged audio buffer data
static class MarshalHelper
{
    public static void Copy(IntPtr source, byte[] destination, int startIndex, int length)
    {
        System.Runtime.InteropServices.Marshal.Copy(source, destination, startIndex, length);
    }
}
