import Cluster, { ClusterSettings } from "./Cluster";

function getWorkersNumber() {
  const workersNumber = process.env.PUPPETEER_WORKERS_NUMBER;
  if (workersNumber) {
    return Number.parseInt(workersNumber);
  }
  return 4;
}

function getIntervalBetweenTasks() {
  const intervalBetweenTasks = process.env.INTERVAL_BETWEEN_TASKS;
  if (intervalBetweenTasks) {
    return Number.parseInt(intervalBetweenTasks);
  }
  return 30;
}

function isPuppeteerHeadless() {
  const headless = process.env.PUPPETEER_IS_HEADLESS;
  if (headless) {
    return headless === "true";
  }
  return true;
}

function getPuppeteerArgs() {
  const args = process.env.PUPPETEER_ARGS;
  if (args) {
    const processed = args.split(",").map((arg) => arg.trim());
    return processed;
  }

  return ["--no-sandbox"];
}

const defaultSettings: ClusterSettings = {
  intervalBetweenTasks: getIntervalBetweenTasks(),
  workersNumber: getWorkersNumber(),
  puppeteerSettings: {
    headless: isPuppeteerHeadless(),
    args: getPuppeteerArgs(),
  },
};

export default function createCluster<T>(
  settings: ClusterSettings = defaultSettings
): Cluster<T> {
  const cluster = new Cluster<T>(settings);
  return cluster;
}
