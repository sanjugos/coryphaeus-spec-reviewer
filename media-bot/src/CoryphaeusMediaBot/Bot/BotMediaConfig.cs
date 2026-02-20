namespace CoryphaeusMediaBot.Bot;

public class BotMediaConfig
{
    public string BotAppId { get; set; } = "";
    public string BotAppSecret { get; set; } = "";
    public string BotTenantId { get; set; } = "";
    public string ServiceDnsName { get; set; } = "";
    public string CertificateThumbprint { get; set; } = "";
    public int InstancePublicPort { get; set; } = 8445;
    public int InstanceInternalPort { get; set; } = 8445;
    public int MediaInstancePublicPort { get; set; } = 20000;
    public int MediaInstanceInternalPort { get; set; } = 20000;
    public string SpeechKey { get; set; } = "";
    public string SpeechRegion { get; set; } = "eastus";
    public string NodeBackendWsUrl { get; set; } = "ws://localhost:3978/ws/media";
}
