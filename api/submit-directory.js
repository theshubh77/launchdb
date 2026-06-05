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

  const { name, description, link, platform } = request.body;

  if (!name || !description || !link || !platform) {
    return response.status(400).json({ error: 'Missing required fields' });
  }

  // Trim and validate field values/lengths
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedDesc = typeof description === 'string' ? description.trim() : '';
  const trimmedLink = typeof link === 'string' ? link.trim() : '';
  const trimmedPlatform = typeof platform === 'string' ? platform.trim().toLowerCase() : '';

  if (!trimmedName || trimmedName.length > 30) {
    return response.status(400).json({ error: 'Directory name is required and must be 30 characters or less' });
  }

  if (!trimmedDesc || trimmedDesc.length > 140) {
    return response.status(400).json({ error: 'Description is required and must be 140 characters or less' });
  }

  const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
  if (!trimmedLink || !urlRegex.test(trimmedLink)) {
    return response.status(400).json({ error: 'Please provide a valid URL starting with http:// or https://' });
  }

  const allowedPlatforms = ['web', 'reddit', 'x', 'facebook', 'github'];
  if (!allowedPlatforms.includes(trimmedPlatform)) {
    return response.status(400).json({ error: 'Invalid platform selected' });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return response.status(500).json({ error: 'GitHub token not configured on server' });
  }

  // Format name with platform prefixes if not already done
  let formattedName = trimmedName;
  if (trimmedPlatform === "reddit" && !formattedName.toLowerCase().startsWith("r/")) {
    formattedName = `r/${formattedName}`;
  } else if (trimmedPlatform === "x" && !formattedName.toLowerCase().startsWith("x/")) {
    formattedName = `x/${formattedName}`;
  } else if (trimmedPlatform === "facebook" && !formattedName.toLowerCase().startsWith("fb/")) {
    formattedName = `fb/${formattedName}`;
  } else if (trimmedPlatform === "github" && !formattedName.toLowerCase().startsWith("gh/")) {
    formattedName = `gh/${formattedName}`;
  }

  const title = `[Directory]: ${formattedName}`;
  const body = `**Directory Name:**\n${formattedName}\n\n**Description:**\n${trimmedDesc}\n\n**Submit Link:**\n${trimmedLink}`;

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
