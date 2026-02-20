using Microsoft.Skype.Bots.Media;

namespace CoryphaeusMediaBot.Media;

/// <summary>
/// Sends PCM audio data as 20ms frames at 50fps back into the Teams meeting
/// through the audio socket.
/// </summary>
public class AudioFramePlayer
{
    private readonly ILogger _logger;

    // 16kHz * 16-bit * 1 channel * 20ms = 640 bytes per frame
    private const int SamplesPerFrame = 320; // 16000 Hz * 0.020s
    private const int BytesPerFrame = SamplesPerFrame * 2; // 16-bit = 2 bytes per sample
    private const int FrameDurationMs = 20;

    public AudioFramePlayer(ILogger logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Plays PCM audio data by splitting it into 20ms frames and sending
    /// them to the audio socket at the correct rate.
    /// </summary>
    public async Task PlayAudioAsync(IAudioSocket audioSocket, byte[] pcmData)
    {
        var totalFrames = pcmData.Length / BytesPerFrame;
        _logger.LogInformation("Playing {TotalFrames} audio frames ({Duration}ms)",
            totalFrames, totalFrames * FrameDurationMs);

        var referenceTime = DateTime.UtcNow.Ticks;

        for (int i = 0; i < totalFrames; i++)
        {
            var frameData = new byte[BytesPerFrame];
            Buffer.BlockCopy(pcmData, i * BytesPerFrame, frameData, 0, BytesPerFrame);

            var buffer = new AudioSendBuffer(
                frameData,
                BytesPerFrame,
                AudioFormat.Pcm16K);

            audioSocket.Send(buffer);

            // Pace the frames at 50fps (20ms intervals)
            var nextFrameTime = referenceTime + ((i + 1) * FrameDurationMs * TimeSpan.TicksPerMillisecond);
            var delay = nextFrameTime - DateTime.UtcNow.Ticks;
            if (delay > 0)
            {
                await Task.Delay(TimeSpan.FromTicks(delay)).ConfigureAwait(false);
            }
        }

        _logger.LogInformation("Audio playback complete");
    }
}

/// <summary>
/// Wraps a byte array as an AudioMediaBuffer for sending to the audio socket.
/// </summary>
public class AudioSendBuffer : AudioMediaBuffer
{
    private readonly byte[] _data;
    private readonly System.Runtime.InteropServices.GCHandle _handle;

    public AudioSendBuffer(byte[] data, int length, AudioFormat format)
    {
        _data = data;
        _handle = System.Runtime.InteropServices.GCHandle.Alloc(_data, System.Runtime.InteropServices.GCHandleType.Pinned);
        Data = _handle.AddrOfPinnedObject();
        Length = length;
        AudioFormat = format;
        Timestamp = DateTime.UtcNow.Ticks;
    }

    protected override void Dispose(bool disposing)
    {
        if (_handle.IsAllocated)
        {
            _handle.Free();
        }
    }
}
