const puppeteer = require("puppeteer-core");
const express = require("express");
const app = express();
const port = 56189;

app.use(express.static("public"));

// Create an array to store recent songs
const recentSongs = [];

const browserlessEndpoint = "wss://chrome.browserless.io?token=9883aff7-00df-4cef-a4e2-e583303a1975";

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/now-playing", async (req, res) => {
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: browserlessEndpoint,
    });

    const page = await browser.newPage();

    await page.goto("https://play.xdevel.com/13189/audio10s976748-1740");

    await page.waitForSelector(".track-artist", { timeout: 180000 });
    await page.waitForSelector(".track-title");

    const artistText = await page.$eval(".track-artist", (element) => element.textContent.trim());
    const songText = await page.$eval(".track-title", (element) => element.textContent.trim());

    await browser.close();

    const nowPlayingInfo = `${artistText} - ${songText}`.trim();

    // Check if the song is not already in the recentSongs array,
    // and it's not "-" or an empty string before adding it
    if (nowPlayingInfo !== "-" && nowPlayingInfo !== "" && !recentSongs.includes(nowPlayingInfo)) {
      // Add the currently playing song to the beginning of the recentSongs array
      recentSongs.unshift(nowPlayingInfo);

      // Ensure the recentSongs array contains a maximum of 10 songs
      if (recentSongs.length > 10) {
        recentSongs.pop(); // Remove the oldest song if there are more than 10
      }
    }

    res.send(nowPlayingInfo);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error");
  }
});

app.get("/recent-songs", (req, res) => {
  // Filter out "-" and empty string from the recentSongs array
  const filteredRecentSongs = recentSongs.filter((song) => song !== "-" && song !== "");

  // Return the filtered list of recent songs
  res.json(filteredRecentSongs);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
