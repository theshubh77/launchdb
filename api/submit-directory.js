const { z } = require('zod');

const urlRegex = /^https?:\/\/(?:www\.)?(?!www\.)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/i;

const submitDirectorySchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Directory name is required")
    .max(30, "Directory name must be 30 characters or less"),
  description: z.string()
    .trim()
    .min(1, "Description is required")
    .max(140, "Description must be 140 characters or less"),
  link: z.string()
    .trim()
    .min(1, "Submission link is required")
    .superRefine((val, ctx) => {
      const trimmed = val.trim();
      const lower = trimmed.toLowerCase();
      if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "URL must start with http:// or https://"
        });
        return;
      }
      if (!urlRegex.test(trimmed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid URL format (e.g. https://example.com)"
        });
      }
    }),
  platform: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
    z.enum(["web", "reddit", "x", "facebook", "github"], {
      message: "Invalid platform selected",
    })
  ),
  turnstileToken: z.string().min(1, "Please complete the security check"),
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

  const parseResult = submitDirectorySchema.safeParse(request.body);
  if (!parseResult.success) {
    const errorMessage = parseResult.error.issues[0].message;
    return response.status(400).json({ error: errorMessage });
  }

  const { name: validatedName, description: validatedDesc, link: validatedLink, platform: validatedPlatform, turnstileToken: validatedToken } = parseResult.data;

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
          response: validatedToken,
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

  // Format name with platform prefixes if not already done
  let formattedName = validatedName;
  if (validatedPlatform === "reddit" && !formattedName.toLowerCase().startsWith("r/")) {
    formattedName = `r/${formattedName}`;
  } else if (validatedPlatform === "x" && !formattedName.toLowerCase().startsWith("x/")) {
    formattedName = `x/${formattedName}`;
  } else if (validatedPlatform === "facebook" && !formattedName.toLowerCase().startsWith("fb/")) {
    formattedName = `fb/${formattedName}`;
  } else if (validatedPlatform === "github" && !formattedName.toLowerCase().startsWith("gh/")) {
    formattedName = `gh/${formattedName}`;
  }

  const platformLabels = {
    web: 'Web Directory',
    reddit: 'Reddit',
    x: 'X (Twitter)',
    facebook: 'Facebook',
    github: 'GitHub'
  };
  const fullPlatformName = platformLabels[validatedPlatform] || validatedPlatform;

  const title = `[New Directory | via LaunchDB]: ${formattedName}`;
  const body = `> [!NOTE]
> This issue was automatically created via the [LaunchDB](https://launchdb.vercel.app) submit directory form and was not created directly by @theshubh77.

### Directory Name
${formattedName}

### Description
${validatedDesc}

### Submission Link
${validatedLink}

### Platform Category
${fullPlatformName}`;

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
          labels: ['enhancement']
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
