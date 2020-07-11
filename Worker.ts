import puppeteer from "puppeteer";
import Task from "./Task";

/**
 * Represents a worker of a cluster of puppeteer.
 * Each is worker is independent, it has a puppeteer browser instance
 * associated to it and has a variable list of tasks to handle.
 */
export default class ClusterWorker<T> {
  private id: string;
  private intervalBetweenTasks: number;
  private browser: puppeteer.Browser;
  private tasks: Task<T>[] = [];
  private running: boolean = false;

  /**
   * constructs a new instance of worker
   *
   * @param id
   * @param browser
   * @param intervalBetweenTasks
   */
  constructor(
    id: string,
    browser: puppeteer.Browser,
    intervalBetweenTasks: number
  ) {
    this.id = id;
    this.browser = browser;
    this.intervalBetweenTasks = intervalBetweenTasks;
  }

  /**
   * retrieves the id of this worker
   */
  getId() {
    return this.id;
  }

  async closeWorker() {
    this.running = false;
    console.log(`worker ${this.id} is being closed...`);
    await this.browser.close();
    console.log(`worker ${this.id} has been successfully closed!`);
  }

  getTaskCount() {
    return this.tasks.length;
  }

  /**
   * executes the given function, when it completes
   * the promise returned will be resolved
   *
   * @param func
   */
  execute(task: Task<T>) {
    this.tasks.push(task);
  }

  /**
   * launches this worker
   * @see startWorker
   */
  launch() {
    this.startWorker();
  }

  private delayed(callback: () => Promise<any>, ms: number) {
    return new Promise(function delayedPromise(accept, reject) {
      setTimeout(async () => {
        try {
          const result = await callback();
          accept(result);
        } catch (err) {
          reject(err);
        }
      }, ms);
    });
  }

  private async startWorker() {
    this.running = true;
    const self = this;

    while (true) {
      if (!this.running) {
        break;
      }

      await this.delayed(async function clusterWorkerDelayedExecutor() {
        if (!self.browser.isConnected()) {
          return;
        }

        let current = self.tasks.shift();

        if (current) {
          console.log(
            `[Worker-${self.id}] executing task ${current.getTaskDescription()}`
          );
          await current.run(self.browser);
          console.log(
            `[Worker-${
              self.id
            }] finished executing task ${current.getTaskDescription()}`
          );

          current = undefined;
        }
      }, this.intervalBetweenTasks);
    }
  }
}
