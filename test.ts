import createCluster from ".";
import Cluster from "./Cluster";
import { Func } from "./Task";

const cluster: Cluster<string> = createCluster();

function createTakeScreenshotTask(html: string): Func<string> {
  return async (browser) => {
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.setContent(html);

    const screenshot = await page.screenshot({
      encoding: "base64",
      omitBackground: false,
      quality: 100,
      type: "jpeg",
    });

    return screenshot;
  };
}

(async () => {
  await cluster.launch();

  const takeScreenshotTask = createTakeScreenshotTask("<h1>Hello, World</h1>");
  const screenshot = await cluster.execute(takeScreenshotTask);

  console.log("screenshot: ", `${screenshot.substring(0, 50)}...`);
})();
