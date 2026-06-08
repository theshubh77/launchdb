const { z } = require('zod');

const urlRegex = /^https?:\/\/(?:www\.)?(?!www\.)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/i;

const reportBrokenLinkSchema = z.object({
  directoryName: z.string().trim().min(1, "Please select a directory"),
  reason: z.enum(["down_404", "submit_changed", "other"], {
    message: "Invalid reason selected",
  }),
  otherDescription: z.string().trim().max(200, "Description must be 200 characters or less").optional(),
  newSubmitLink: z.string().trim().optional().superRefine((val, ctx) => {
    if (!val) return;
    const lower = val.toLowerCase();
    if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "URL must start with http:// or https://"
      });
      return;
    }
    if (!urlRegex.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a valid URL format (e.g. https://example.com)"
      });
    }
  }),
  turnstileToken: z.string().min(1, "Please complete the security check"),
}).refine((data) => {
  if (data.reason === "other" && (!data.otherDescription || data.otherDescription.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Please specify the other reason",
  path: ["otherDescription"],
});

module.exports = async function handler(request, response) {
  // CORS Headers
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const parseResult = reportBrokenLinkSchema.safeParse(request.body);
  if (!parseResult.success) {
    const errorMessage = parseResult.error.issues[0]?.message || "Validation failed";
    return response.status(400).json({ error: errorMessage });
  }

  const { directoryName, reason, otherDescription, newSubmitLink, turnstileToken } = parseResult.data;

  // Verify Cloudflare Turnstile token
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (!turnstileSecret) {
    return response.status(500).json({ error: 'Turnstile secret not configured on server' });
  }

  try {
    const turnstileResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: turnstileSecret,
          response: turnstileToken,
        }),
      }
    );

    const turnstileResult = await turnstileResponse.json();
    if (!turnstileResult.success) {
      return response.status(400).json({ error: 'Security check failed. Please try again.' });
    }
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return response.status(500).json({ error: 'Internal server error during verification' });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return response.status(500).json({ error: 'GitHub token not configured on server' });
  }

  // Format reason label
  let reasonLabel = "";
  if (reason === "down_404") {
    reasonLabel = "Website is down / returns a 404";
  } else if (reason === "submit_changed") {
    reasonLabel = "Submit link has changed";
  } else {
    reasonLabel = `Other: ${otherDescription}`;
  }

  const title = `[Broken Link Report]: ${directoryName}`;
  const body = `**Directory Name:**\n${directoryName}\n\n**Reason:**\n${reasonLabel}\n\n**New Submit Link:**\n${newSubmitLink || "Not provided"}`;

  try {
    const apiResponse = await fetch(
      'https://api.github.com/repos/theshubh77/awesome-saas-directories/issues',
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'LaunchDB-Submit-Bot'
        },
        body: JSON.stringify({
          title,
          body,
          labels: ['bug', 'broken-link']
        })
      }
    );

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('GitHub API error:', errorText);
      return response.status(apiResponse.status).json({ 
        error: `Failed to create GitHub issue: ${apiResponse.statusText}`,
        details: errorText 
      });
    }

    const issueData = await apiResponse.json();
    return response.status(200).json({ 
      success: true, 
      issueUrl: issueData.html_url,
      issueNumber: issueData.number
    });
  } catch (error) {
    console.error('Error submitting to GitHub:', error);
    return response.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
