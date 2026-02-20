using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Graph.Communications.Client;
using CoryphaeusMediaBot.Bot;

namespace CoryphaeusMediaBot.Controllers;

/// <summary>
/// Handles Graph Communications Platform call notifications.
/// This is the webhook endpoint that receives calling events from Microsoft Graph.
/// </summary>
[ApiController]
[Route("api/calling")]
public class PlatformCallController : ControllerBase
{
    private readonly MediaBotService _botService;
    private readonly ILogger<PlatformCallController> _logger;

    public PlatformCallController(MediaBotService botService, ILogger<PlatformCallController> logger)
    {
        _botService = botService;
        _logger = logger;
    }

    /// <summary>
    /// Handles incoming call notifications from Microsoft Graph.
    /// The Graph Communications SDK processes these automatically.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> HandleNotification()
    {
        _logger.LogInformation("Received calling notification");

        try
        {
            var client = _botService.Client;

            // Convert ASP.NET Core HttpRequest to System.Net.Http.HttpRequestMessage
            var requestMessage = new HttpRequestMessage
            {
                Method = new HttpMethod(Request.Method),
                RequestUri = new Uri($"{Request.Scheme}://{Request.Host}{Request.Path}{Request.QueryString}"),
            };

            // Copy body
            requestMessage.Content = new StreamContent(Request.Body);
            if (Request.ContentType != null)
            {
                requestMessage.Content.Headers.ContentType = MediaTypeHeaderValue.Parse(Request.ContentType);
            }

            // Copy non-content headers
            foreach (var header in Request.Headers)
            {
                if (!header.Key.StartsWith("Content-", StringComparison.OrdinalIgnoreCase))
                {
                    requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
                }
            }

            var response = await client.ProcessNotificationAsync(requestMessage).ConfigureAwait(false);
            return StatusCode((int)response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing calling notification");
            return StatusCode(500, "Error processing notification");
        }
    }

    /// <summary>
    /// Handles validation callbacks from the Bot Framework.
    /// </summary>
    [HttpGet]
    public IActionResult Validate()
    {
        return Ok("Calling endpoint active");
    }
}
