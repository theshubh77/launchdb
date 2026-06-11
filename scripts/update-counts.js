const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // 1. Fetch live directories list
    const url = 'https://raw.githubusercontent.com/theshubh77/awesome-saas-directories/master/launchdb.json';
    console.log(`Fetching directories from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch directories from source: ${response.statusText}`);
    }
    const data = await response.json();
    const count = data.length;
    console.log(`Successfully fetched ${count} directories.`);

    // 2. Format the count string:
    // If count >= 50, round down to the nearest multiple of 50.
    // e.g. 132 -> 100+, 152 -> 150+, etc.
    let countStr;
    if (count >= 50) {
      const rounded = Math.floor(count / 50) * 50;
      countStr = `${rounded}+`;
    } else {
      countStr = `${count}`;
    }
    console.log(`Calculated count string: ${countStr}`);

    // 3. Read and update README.md
    const readmePath = path.join(__dirname, '../README.md');
    if (fs.existsSync(readmePath)) {
      let readmeContent = fs.readFileSync(readmePath, 'utf8');

      // Replace matching pattern "submit their SaaS to \d+\+ web directories"
      const readmeRegex = /(submit their SaaS to )\d+\+( web directories)/i;
      if (readmeRegex.test(readmeContent)) {
        readmeContent = readmeContent.replace(readmeRegex, `$1${countStr}$2`);
        fs.writeFileSync(readmePath, readmeContent, 'utf8');
        console.log('README.md updated successfully.');
      } else {
        console.warn('Could not find matching count pattern in README.md.');
      }
    } else {
      console.error('README.md not found.');
    }

    // 4. Update fallback JSON file
    const fallbackPath = path.join(__dirname, '../public/launchdb-fallback.json');
    const dirPath = path.dirname(fallbackPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(fallbackPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('public/launchdb-fallback.json updated successfully.');

    // 5. Output new description to GITHUB_OUTPUT environment file for Actions workflow
    const newDescription = `LaunchDB is an open-source directory platform designed for developers, founders, and indie hackers to submit their SaaS to ${countStr} web directories, subreddits, X communities, Facebook groups, and GitHub repositories to find early adopters and build high-quality SEO backlinks.`;
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `description=${newDescription}\n`);
      console.log(`Output description set: ${newDescription}`);
    } else {
      console.log(`Simulated description: ${newDescription}`);
    }

  } catch (error) {
    console.error('Error running update-counts script:', error);
    process.exit(1);
  }
}

main();
