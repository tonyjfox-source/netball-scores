import fs from 'fs';
import path from 'path';

async function main() {
  const url = 'https://www.netballnorthharbour.co.nz/draws-results/college-competition/college-saturday-1';
  console.log(`Fetching HTML from: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const outputPath = path.resolve('src/scripts/sample.html');
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`Successfully saved HTML to ${outputPath}`);
  } catch (error) {
    console.error('Error fetching or saving HTML:', error);
    process.exit(1);
  }
}

main();
