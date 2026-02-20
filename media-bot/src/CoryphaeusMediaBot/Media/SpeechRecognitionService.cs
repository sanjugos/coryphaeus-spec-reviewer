using Microsoft.CognitiveServices.Speech;
using CoryphaeusMediaBot.Bot;

namespace CoryphaeusMediaBot.Media;

/// <summary>
/// Manages Azure Speech SDK configuration for speech-to-text.
/// Individual recognizer instances are created by AudioProcessor per participant.
/// </summary>
public class SpeechRecognitionService
{
    private readonly BotMediaConfig _config;
    private readonly ILogger<SpeechRecognitionService> _logger;

    public SpeechRecognitionService(BotMediaConfig config, ILogger<SpeechRecognitionService> logger)
    {
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Creates a SpeechConfig instance configured for continuous recognition.
    /// </summary>
    public SpeechConfig CreateSpeechConfig()
    {
        var speechConfig = SpeechConfig.FromSubscription(_config.SpeechKey, _config.SpeechRegion);
        speechConfig.SpeechRecognitionLanguage = "en-US";
        speechConfig.SetProfanity(ProfanityOption.Masked);
        speechConfig.EnableAudioLogging();

        _logger.LogInformation("Created speech config for region {Region}", _config.SpeechRegion);
        return speechConfig;
    }

    /// <summary>
    /// Performs a one-shot speech recognition from a byte array of PCM audio.
    /// Useful for testing or short audio clips.
    /// </summary>
    public async Task<string?> RecognizeOnceAsync(byte[] pcmAudio)
    {
        var speechConfig = CreateSpeechConfig();

        using var pushStream = Microsoft.CognitiveServices.Speech.Audio.AudioInputStream.CreatePushStream(
            Microsoft.CognitiveServices.Speech.Audio.AudioStreamFormat.GetWaveFormatPCM(16000, 16, 1));
        pushStream.Write(pcmAudio);
        pushStream.Close();

        using var audioConfig = Microsoft.CognitiveServices.Speech.Audio.AudioConfig.FromStreamInput(pushStream);
        using var recognizer = new SpeechRecognizer(speechConfig, audioConfig);

        var result = await recognizer.RecognizeOnceAsync().ConfigureAwait(false);

        return result.Reason switch
        {
            ResultReason.RecognizedSpeech => result.Text,
            ResultReason.NoMatch => null,
            _ => null,
        };
    }
}
