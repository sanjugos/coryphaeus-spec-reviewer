using System.Net;
using System.Security.Cryptography.X509Certificates;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Graph.Communications.Calls;
using Microsoft.Graph.Communications.Calls.Media;
using Microsoft.Graph.Communications.Client;
using Microsoft.Graph.Communications.Client.Authentication;
using Microsoft.Graph.Communications.Common;
using Microsoft.Graph.Communications.Common.Telemetry;
using Microsoft.Graph.Communications.Resources;
using Microsoft.Graph.Models;
using Microsoft.Skype.Bots.Media;
using CoryphaeusMediaBot.Call;
using CoryphaeusMediaBot.Media;
using CoryphaeusMediaBot.WebSocket;

namespace CoryphaeusMediaBot.Bot;

/// <summary>
/// Core media bot service that manages the Graph Communications client
/// and handles call lifecycle events.
/// </summary>
public class MediaBotService
{
    private readonly BotMediaConfig _config;
    private readonly SpeechRecognitionService _sttService;
    private readonly SpeechSynthesisService _ttsService;
    private readonly BackendWebSocketClient _wsClient;
    private readonly ILogger<MediaBotService> _logger;

    private ICommunicationsClient? _client;
    private readonly Dictionary<string, CallHandler> _callHandlers = new();

    public MediaBotService(
        BotMediaConfig config,
        SpeechRecognitionService sttService,
        SpeechSynthesisService ttsService,
        BackendWebSocketClient wsClient,
        ILogger<MediaBotService> logger)
    {
        _config = config;
        _sttService = sttService;
        _ttsService = ttsService;
        _wsClient = wsClient;
        _logger = logger;
    }

    /// <summary>
    /// Gets the Graph Communications client, initializing it if needed.
    /// </summary>
    public ICommunicationsClient Client
    {
        get
        {
            if (_client == null)
            {
                throw new InvalidOperationException("Communications client not initialized. Call Initialize() first.");
            }
            return _client;
        }
    }

    /// <summary>
    /// Initializes the Graph Communications client with media platform configuration.
    /// </summary>
    public void Initialize()
    {
        var certificate = GetCertificate(_config.CertificateThumbprint);

        var mediaPlatformSettings = new MediaPlatformSettings
        {
            MediaPlatformInstanceSettings = new MediaPlatformInstanceSettings
            {
                CertificateThumbprint = _config.CertificateThumbprint,
                InstanceInternalPort = _config.InstanceInternalPort,
                InstancePublicIPAddress = IPAddress.Any,
                InstancePublicPort = _config.InstancePublicPort,
                ServiceFqdn = _config.ServiceDnsName,
            },
            ApplicationId = _config.BotAppId,
        };

        var authProvider = new AuthenticationProvider(
            _config.BotAppId,
            _config.BotAppSecret,
            _config.BotTenantId,
            _logger);

        var builder = new CommunicationsClientBuilder("CoryphaeusMediaBot", _config.BotAppId, new GraphLogger("CoryphaeusMediaBot"));
        builder.SetAuthenticationProvider(authProvider);
        builder.SetMediaPlatformSettings(mediaPlatformSettings);
        builder.SetNotificationUrl(new Uri($"https://{_config.ServiceDnsName}:{_config.InstancePublicPort}/api/calling"));
        builder.SetServiceBaseUrl(new Uri($"https://{_config.ServiceDnsName}:{_config.InstancePublicPort}"));

        _client = builder.Build();

        _client.Calls().OnIncoming += OnIncomingCall;
        _client.Calls().OnUpdated += OnCallUpdated;

        _logger.LogInformation("Media bot service initialized with app ID {AppId}", _config.BotAppId);
    }

    /// <summary>
    /// Joins a Teams meeting by its join URL.
    /// </summary>
    public async Task<string> JoinMeetingAsync(string joinUrl, string displayName = "Coryphaeus")
    {
        if (_client == null)
        {
            Initialize();
        }

        var (chatInfo, meetingInfo) = ParseJoinUrl(joinUrl);
        var mediaSession = CreateMediaSession();

        var joinParams = new JoinMeetingParameters(chatInfo, meetingInfo, mediaSession)
        {
            TenantId = _config.BotTenantId,
        };

        if (!string.IsNullOrWhiteSpace(displayName))
        {
            joinParams.GuestIdentity = new Identity
            {
                Id = Guid.NewGuid().ToString(),
                DisplayName = displayName,
            };
        }

        var call = await _client!.Calls().AddAsync(joinParams).ConfigureAwait(false);
        var callId = call.Id;

        var handler = new CallHandler(call, _config, _sttService, _ttsService, _wsClient, _logger);
        _callHandlers[callId] = handler;

        _logger.LogInformation("Joined meeting {JoinUrl} with call ID {CallId}", joinUrl, callId);
        return callId;
    }

    /// <summary>
    /// Creates the media session for audio send/receive.
    /// </summary>
    private ILocalMediaSession CreateMediaSession()
    {
        var audioSocketSettings = new AudioSocketSettings
        {
            StreamDirections = StreamDirection.Sendrecv,
            SupportedAudioFormat = AudioFormat.Pcm16K,
            ReceiveUnmixedMeetingAudio = true,
        };

        return new MediaSession(
            _client!.GraphLogger,
            Guid.NewGuid(),
            audioSocketSettings,
            (VideoSocketSettings)null!,
            (VideoSocketSettings)null!,
            (DataSocketSettings)null!);
    }

    /// <summary>
    /// Parses a Teams meeting join URL into ChatInfo and MeetingInfo.
    /// </summary>
    private static (ChatInfo, MeetingInfo) ParseJoinUrl(string joinUrl)
    {
        var decodedUrl = WebUtility.UrlDecode(joinUrl);
        var regex = new Regex(@"https://teams\.microsoft\.com.*/(?<thread>[^/]+)/(?<message>[^?]+)\?context=(?<context>\{.*\})");
        var match = regex.Match(decodedUrl);

        if (!match.Success)
        {
            throw new ArgumentException($"Join URL cannot be parsed: {joinUrl}", nameof(joinUrl));
        }

        var contextJson = JsonDocument.Parse(match.Groups["context"].Value);
        var tid = contextJson.RootElement.GetProperty("Tid").GetString() ?? "";
        var oid = contextJson.RootElement.GetProperty("Oid").GetString() ?? "";

        var chatInfo = new ChatInfo
        {
            ThreadId = match.Groups["thread"].Value,
            MessageId = match.Groups["message"].Value,
        };

        var meetingInfo = new OrganizerMeetingInfo
        {
            Organizer = new IdentitySet
            {
                User = new Identity { Id = oid },
            },
        };
        meetingInfo.Organizer.User.AdditionalData = new Dictionary<string, object>
        {
            ["tenantId"] = tid,
        };

        return (chatInfo, meetingInfo);
    }

    private void OnIncomingCall(ICallCollection sender, CollectionEventArgs<ICall> args)
    {
        var call = args.AddedResources.FirstOrDefault();
        if (call == null) return;

        _logger.LogInformation("Incoming call {CallId}", call.Id);

        // Accept incoming calls automatically
        _ = Task.Run(async () =>
        {
            try
            {
                await call.AnswerAsync(CreateMediaSession()).ConfigureAwait(false);
                var handler = new CallHandler(call, _config, _sttService, _ttsService, _wsClient, _logger);
                _callHandlers[call.Id] = handler;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to answer incoming call {CallId}", call.Id);
            }
        });
    }

    private void OnCallUpdated(ICallCollection sender, CollectionEventArgs<ICall> args)
    {
        foreach (var call in args.RemovedResources)
        {
            if (_callHandlers.TryGetValue(call.Id, out var handler))
            {
                handler.Dispose();
                _callHandlers.Remove(call.Id);
                _logger.LogInformation("Call ended and cleaned up: {CallId}", call.Id);
            }
        }
    }

    private static X509Certificate2 GetCertificate(string thumbprint)
    {
        using var store = new X509Store(StoreName.My, StoreLocation.LocalMachine);
        store.Open(OpenFlags.ReadOnly);
        var certs = store.Certificates.Find(X509FindType.FindByThumbprint, thumbprint, validOnly: false);
        if (certs.Count == 0)
        {
            throw new InvalidOperationException($"Certificate with thumbprint {thumbprint} not found in LocalMachine\\My store");
        }
        return certs[0];
    }

    public IReadOnlyDictionary<string, CallHandler> GetActiveCallHandlers() => _callHandlers;
}

/// <summary>
/// Simple authentication provider for Graph Communications.
/// </summary>
public class AuthenticationProvider : IRequestAuthenticationProvider
{
    private readonly string _appId;
    private readonly string _appSecret;
    private readonly string _tenantId;
    private readonly ILogger _logger;

    public AuthenticationProvider(string appId, string appSecret, string tenantId, ILogger logger)
    {
        _appId = appId;
        _appSecret = appSecret;
        _tenantId = tenantId;
        _logger = logger;
    }

    public async Task AuthenticateOutboundRequestAsync(HttpRequestMessage request, string tenantId)
    {
        var token = await GetTokenAsync(tenantId ?? _tenantId).ConfigureAwait(false);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    public Task<RequestValidationResult> ValidateInboundRequestAsync(HttpRequestMessage request)
    {
        // In production, validate the inbound request token
        return Task.FromResult(new RequestValidationResult { IsValid = true, TenantId = _tenantId });
    }

    private async Task<string> GetTokenAsync(string tenantId)
    {
        var app = Microsoft.Identity.Client.ConfidentialClientApplicationBuilder
            .Create(_appId)
            .WithClientSecret(_appSecret)
            .WithAuthority($"https://login.microsoftonline.com/{tenantId}")
            .Build();

        var result = await app.AcquireTokenForClient(
            new[] { "https://graph.microsoft.com/.default" })
            .ExecuteAsync()
            .ConfigureAwait(false);

        return result.AccessToken;
    }
}
