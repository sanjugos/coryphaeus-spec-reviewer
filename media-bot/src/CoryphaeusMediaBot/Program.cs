using CoryphaeusMediaBot.Bot;
using CoryphaeusMediaBot.Media;
using CoryphaeusMediaBot.WebSocket;

var builder = WebApplication.CreateBuilder(args);

// Add configuration
builder.Configuration.AddEnvironmentVariables();

// Register services
builder.Services.AddControllers();
builder.Services.AddSingleton<BotMediaConfig>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    return new BotMediaConfig
    {
        BotAppId = config["BOT_APP_ID"] ?? throw new InvalidOperationException("BOT_APP_ID is required"),
        BotAppSecret = config["BOT_APP_SECRET"] ?? throw new InvalidOperationException("BOT_APP_SECRET is required"),
        BotTenantId = config["BOT_TENANT_ID"] ?? throw new InvalidOperationException("BOT_TENANT_ID is required"),
        ServiceDnsName = config["SERVICE_DNS_NAME"] ?? throw new InvalidOperationException("SERVICE_DNS_NAME is required"),
        CertificateThumbprint = config["CERTIFICATE_THUMBPRINT"] ?? throw new InvalidOperationException("CERTIFICATE_THUMBPRINT is required"),
        InstancePublicPort = int.Parse(config["INSTANCE_PUBLIC_PORT"] ?? "8445"),
        InstanceInternalPort = int.Parse(config["INSTANCE_INTERNAL_PORT"] ?? "8445"),
        MediaInstancePublicPort = int.Parse(config["MEDIA_INSTANCE_PUBLIC_PORT"] ?? "20000"),
        MediaInstanceInternalPort = int.Parse(config["MEDIA_INSTANCE_INTERNAL_PORT"] ?? "20000"),
        SpeechKey = config["AZURE_SPEECH_KEY"] ?? throw new InvalidOperationException("AZURE_SPEECH_KEY is required"),
        SpeechRegion = config["AZURE_SPEECH_REGION"] ?? "eastus",
        NodeBackendWsUrl = config["NODE_BACKEND_WS_URL"] ?? "ws://localhost:3978/ws/media",
    };
});

builder.Services.AddSingleton<SpeechRecognitionService>();
builder.Services.AddSingleton<SpeechSynthesisService>();
builder.Services.AddSingleton<BackendWebSocketClient>();
builder.Services.AddSingleton<MediaBotService>();

var app = builder.Build();

app.MapControllers();

// Health check
app.MapGet("/api/health", () => Results.Json(new
{
    status = "healthy",
    service = "coryphaeus-media-bot",
    version = "1.0.0",
    timestamp = DateTime.UtcNow.ToString("o"),
}));

// Start the backend WebSocket client
var wsClient = app.Services.GetRequiredService<BackendWebSocketClient>();
_ = Task.Run(() => wsClient.ConnectAsync());

app.Run();
