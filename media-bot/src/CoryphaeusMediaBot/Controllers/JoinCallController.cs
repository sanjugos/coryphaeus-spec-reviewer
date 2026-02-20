using Microsoft.AspNetCore.Mvc;
using CoryphaeusMediaBot.Bot;

namespace CoryphaeusMediaBot.Controllers;

/// <summary>
/// HTTP trigger endpoint to instruct the bot to join a Teams meeting.
/// Called by external systems or the Node.js backend to initiate meeting participation.
/// </summary>
[ApiController]
[Route("api/join")]
public class JoinCallController : ControllerBase
{
    private readonly MediaBotService _botService;
    private readonly ILogger<JoinCallController> _logger;

    public JoinCallController(MediaBotService botService, ILogger<JoinCallController> logger)
    {
        _botService = botService;
        _logger = logger;
    }

    /// <summary>
    /// Joins a Teams meeting by its join URL.
    /// POST /api/join { "joinUrl": "https://teams.microsoft.com/l/meetup-join/...", "displayName": "Coryphaeus" }
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> JoinMeeting([FromBody] JoinMeetingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.JoinUrl))
        {
            return BadRequest(new { error = "joinUrl is required" });
        }

        _logger.LogInformation("Join meeting request: {JoinUrl}", request.JoinUrl);

        try
        {
            var callId = await _botService.JoinMeetingAsync(
                request.JoinUrl,
                request.DisplayName ?? "Coryphaeus"
            ).ConfigureAwait(false);

            return Ok(new
            {
                callId,
                status = "joined",
                message = $"Successfully joined meeting with call ID {callId}",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to join meeting {JoinUrl}", request.JoinUrl);
            return StatusCode(500, new { error = "Failed to join meeting", details = ex.Message });
        }
    }

    /// <summary>
    /// Lists active calls/meetings.
    /// GET /api/join
    /// </summary>
    [HttpGet]
    public IActionResult ListActiveCalls()
    {
        var handlers = _botService.GetActiveCallHandlers();
        var calls = handlers.Select(h => new
        {
            callId = h.Key,
            meetingId = h.Value.MeetingId,
        });

        return Ok(new { activeCalls = calls });
    }
}

public class JoinMeetingRequest
{
    public string JoinUrl { get; set; } = "";
    public string? DisplayName { get; set; }
}
