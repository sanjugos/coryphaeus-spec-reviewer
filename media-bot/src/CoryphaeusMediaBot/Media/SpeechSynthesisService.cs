using Microsoft.CognitiveServices.Speech;
using CoryphaeusMediaBot.Bot;

namespace CoryphaeusMediaBot.Media;

/// <summary>
/// Azure Speech TTS service. Converts text responses from Claude
/// into PCM audio that can be sent back to the Teams meeting.
/// </summary>
public class SpeechSynthesisService
{
    private readonly BotMediaConfig _config;
    private readonly ILogger<SpeechSynthesisService> _logger;

    public SpeechSynthesisService(BotMediaConfig config, ILogger<SpeechSynthesisService> logger)
    {
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Synthesizes text to raw PCM audio (16kHz, 16-bit, mono).
    /// Returns the PCM byte array suitable for sending to the meeting audio socket.
    /// </summary>
    public async Task<byte[]?> SynthesizeSpeechAsync(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        var speechConfig = SpeechConfig.FromSubscription(_config.SpeechKey, _config.SpeechRegion);

        // Use a natural-sounding voice
        speechConfig.SpeechSynthesisVoiceName = "en-US-JennyNeural";

        // Output raw PCM 16kHz 16-bit mono (matches Teams audio format)
        speechConfig.SetSpeechSynthesisOutputFormat(SpeechSynthesisOutputFormat.Raw16Khz16BitMonoPcm);

        using var synthesizer = new SpeechSynthesizer(speechConfig, null);

        var result = await synthesizer.SpeakTextAsync(text).ConfigureAwait(false);

        if (result.Reason == ResultReason.SynthesizingAudioCompleted)
        {
            _logger.LogInformation("TTS synthesized {Bytes} bytes for text: {Text}",
                result.AudioData.Length, text[..Math.Min(text.Length, 60)]);
            return result.AudioData;
        }

        if (result.Reason == ResultReason.Canceled)
        {
            var cancellation = SpeechSynthesisCancellationDetails.FromResult(result);
            _logger.LogError("TTS canceled: {Reason} - {Details}",
                cancellation.Reason, cancellation.ErrorDetails);
        }

        return null;
    }
}
