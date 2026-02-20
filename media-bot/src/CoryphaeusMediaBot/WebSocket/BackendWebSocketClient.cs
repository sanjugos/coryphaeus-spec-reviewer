using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using CoryphaeusMediaBot.Bot;

namespace CoryphaeusMediaBot.WebSocket;

/// <summary>
/// WebSocket client that connects to the Node.js backend at /ws/media.
/// Sends transcriptions, receives speak commands.
/// </summary>
public class BackendWebSocketClient : IDisposable
{
    private readonly BotMediaConfig _config;
    private readonly ILogger<BackendWebSocketClient> _logger;
    private ClientWebSocket? _ws;
    private CancellationTokenSource _cts = new();
    private bool _disposed;

    /// <summary>
    /// Fired when the Node.js backend sends a "speak" command for a meeting.
    /// </summary>
    public event Action<string, string>? OnSpeakCommand; // meetingId, text

    public bool IsConnected => _ws?.State == WebSocketState.Open;

    public BackendWebSocketClient(BotMediaConfig config, ILogger<BackendWebSocketClient> logger)
    {
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Connects to the Node.js backend WebSocket and starts listening for messages.
    /// Automatically reconnects on disconnection.
    /// </summary>
    public async Task ConnectAsync()
    {
        while (!_cts.IsCancellationRequested)
        {
            try
            {
                _ws?.Dispose();
                _ws = new ClientWebSocket();

                _logger.LogInformation("Connecting to Node.js backend at {Url}", _config.NodeBackendWsUrl);
                await _ws.ConnectAsync(new Uri(_config.NodeBackendWsUrl), _cts.Token).ConfigureAwait(false);
                _logger.LogInformation("Connected to Node.js backend");

                await ReceiveLoopAsync().ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WebSocket connection error, reconnecting in 5s...");
                try
                {
                    await Task.Delay(5000, _cts.Token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
    }

    private async Task ReceiveLoopAsync()
    {
        var buffer = new byte[4096];

        while (_ws?.State == WebSocketState.Open && !_cts.IsCancellationRequested)
        {
            var result = await _ws.ReceiveAsync(buffer, _cts.Token).ConfigureAwait(false);

            if (result.MessageType == WebSocketMessageType.Close)
            {
                _logger.LogInformation("Backend closed WebSocket connection");
                break;
            }

            if (result.MessageType == WebSocketMessageType.Text)
            {
                var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                HandleBackendMessage(json);
            }
        }
    }

    private void HandleBackendMessage(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var type = root.GetProperty("type").GetString();

            switch (type)
            {
                case "speak":
                    var meetingId = root.GetProperty("meetingId").GetString() ?? "";
                    var text = root.GetProperty("text").GetString() ?? "";
                    _logger.LogInformation("Received speak command for meeting {MeetingId}", meetingId);
                    OnSpeakCommand?.Invoke(meetingId, text);
                    break;

                case "ack":
                    _logger.LogDebug("Received ack for meeting {MeetingId}",
                        root.GetProperty("meetingId").GetString());
                    break;

                default:
                    _logger.LogWarning("Unknown message type from backend: {Type}", type);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing backend message: {Json}", json);
        }
    }

    /// <summary>
    /// Sends a transcription message to the Node.js backend.
    /// </summary>
    public void SendTranscription(string meetingId, string participantId, string displayName, string text, bool isFinal)
    {
        var msg = new
        {
            type = "transcription",
            meetingId,
            participantId,
            displayName,
            text,
            isFinal,
        };
        SendMessageAsync(JsonSerializer.Serialize(msg));
    }

    /// <summary>
    /// Notifies the backend that the bot joined a meeting.
    /// </summary>
    public void SendMeetingJoined(string meetingId)
    {
        var msg = new { type = "meeting_joined", meetingId };
        SendMessageAsync(JsonSerializer.Serialize(msg));
    }

    /// <summary>
    /// Notifies the backend that the bot left a meeting.
    /// </summary>
    public void SendMeetingLeft(string meetingId)
    {
        var msg = new { type = "meeting_left", meetingId };
        SendMessageAsync(JsonSerializer.Serialize(msg));
    }

    private async void SendMessageAsync(string json)
    {
        if (_ws?.State != WebSocketState.Open)
        {
            _logger.LogWarning("Cannot send message — WebSocket not connected");
            return;
        }

        try
        {
            var bytes = Encoding.UTF8.GetBytes(json);
            await _ws.SendAsync(bytes, WebSocketMessageType.Text, true, _cts.Token).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending WebSocket message");
        }
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _cts.Cancel();
        _ws?.Dispose();
    }
}
