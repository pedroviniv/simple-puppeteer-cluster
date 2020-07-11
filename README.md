# simple-puppeteer-cluster

A _really_ simple library that creates a cluster of puppeteers and exposes an API
that executes tasks on top of a puppeteer browser instance.

## example

```typescript
import createCluster from "simple-puppeteer-cluster";
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
```

In the example above, we create a default cluster that resolves tasks that resolves to
a string content. (we can define clusters of any type!) In the case above, that task we
created take screenshot of a given html content.

Each task that we submit to execution receives a puppeteer browser as parameter and returns a promise
of T. (whatever our result type is!) simple as that.

## how it works

```typescript
import createCluster from "simple-puppeteer-cluster";
const cluster: Cluster<string> = createCluster();
```

That function does nothing but create an instance of a cluster based on settings (or using the default
one, we'll see it below).

The real magic occurs when you call:

```typescript
await cluster.launch();
```

The code above will actually launch the cluster by creating and loading all workers, which
means creating each instance of browser. Once this method is finish executing (and that's why
we are "awaiting" to it to finish) our cluster will be ready to handle tasks!

## settings

```typescript
import createCluster from "simple-puppeteer-cluster";
const cluster: Cluster<string> = createCluster();
```

if nothing is passed to `createCluster` function, it will create
the cluster using the following settings:

```typescript
const defaultSettings: ClusterSettings = {
  // each worker has an infinite loop inside. each loop gets
  // the first task in a queue, and handles it!
  // this defines at which rate the loop will do it's work. default is 30ms.
  intervalBetweenTasks: 30,
  // number of workers, a.k.a. number of browsers instances. default is 4
  workersNumber: 4,
  // puppeteer settings
  puppeteerSettings: {
    headless: true, // if it's headless or not
    args: [], // chromium args
  },
};
```

And of course, you can configure by your own by passing a json following
the same structure as it's shown above.
