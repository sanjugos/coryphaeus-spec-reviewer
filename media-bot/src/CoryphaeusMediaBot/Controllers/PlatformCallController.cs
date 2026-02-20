using Microsoft.AspNetCore.Mvc;
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
            // The Graph Communications client processes the notification
            // from the HTTP request body and routes it to the appropriate handler
            var client = _botService.Client;
            await client.ProcessNotificationAsync(Request).ConfigureAwait(false);
            return Ok();
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
