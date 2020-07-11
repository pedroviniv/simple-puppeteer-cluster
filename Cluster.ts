import ClusterWorker from "./Worker";
import Task from "./Task";

import { v4 as uuidv4 } from "uuid";
import puppeteer from "puppeteer";

export interface PuppeteerSettings {
  headless: boolean;
  args?: any;
}

export interface ClusterSettings {
  workersNumber: number;
  intervalBetweenTasks: number;
  puppeteerSettings: PuppeteerSettings;
}

export default class Cluster<T> {
  private workers: ClusterWorker<T>[] = [];
  private settings: ClusterSettings;

  constructor(settings: ClusterSettings) {
    this.settings = settings;
  }

  /**
   * inicializa o cluster
   * 1. cria os workers
   * 2. inicializa os workers
   */
  async launch() {
    await this.createWorkers();
    this.launchWorkers();
  }

  /**
   * cria os workers e os prepara para execução
   */
  private async createWorkers() {
    const { workersNumber } = this.settings;
    for (let index = 0; index < workersNumber; index++) {
      const worker = await this.createWorker(index);
      this.workers.push(worker);
    }
  }

  /**
   * inicializa os workers, um por um
   */
  launchWorkers() {
    console.log("launching workers...");
    this.workers.forEach(function workerLauncher(worker) {
      console.log("launching worker ", worker.getId());
      worker.launch();
    });
  }

  /**
   * finaliza o cluster,
   *
   * 1. itera sobre os workers finalizando-os um por um
   * 2. a promise é resolvida apenas quando todos os
   * clusters são finalizados
   */
  async close() {
    return await Promise.all(
      this.workers.map(async (worker) => {
        return await worker.closeWorker();
      })
    );
  }

  /**
   * cria uma instância de worker
   * @param index posição que ele será armazenado na array
   * @param intervalBetweenTasks intervalo entre os ciclos do worker
   */
  async createWorker(index: number): Promise<ClusterWorker<T>> {
    const { intervalBetweenTasks, puppeteerSettings } = this.settings;

    const browser = await this.createBrowser(index, puppeteerSettings);
    const workerId = `${index + 1}`;
    return new ClusterWorker<T>(workerId, browser, intervalBetweenTasks);
  }

  /**
   * cria uma instância do puppeteer
   * a promise é resolvida quando a instância é criada
   * @param index
   * @param puppeteerArgs
   */
  async createBrowser(
    index: number,
    puppeteerSettings: PuppeteerSettings
  ): Promise<puppeteer.Browser> {
    const { headless } = puppeteerSettings;
    return await puppeteer.launch({ args: puppeteerSettings.args, headless });
  }

  /**
   * registers the task to the most free
   * worker
   * @param task
   */
  pushTask(task: Task<T>) {
    const mostFreeWorker = this.getMostFreeWorker();
    if (mostFreeWorker) {
      mostFreeWorker.execute(task);
    }
  }

  /**
   * retrevies the worker with less
   * tasks to handle
   */
  getMostFreeWorker() {
    if (this.workers.length === 0) {
      return;
    }

    let mostFreeWorker = this.workers[0];
    if (this.workers.length === 1) {
      return mostFreeWorker;
    }

    const { workersNumber } = this.settings;

    for (let i = 1; i < workersNumber; i++) {
      const current = this.workers[i];
      if (current.getTaskCount() < mostFreeWorker.getTaskCount()) {
        mostFreeWorker = current;
      }
    }

    return mostFreeWorker;
  }

  /**
   * executes the given function, when it completes
   * the promise returned will be resolved
   *
   * @param func
   */
  execute(
    func: (browser: puppeteer.Browser) => Promise<T>,
    description?: string
  ): Promise<T> {
    const taskId = this.generateTaskId();
    const task = new Task<T>(taskId, func, description);
    const promise = task.getPromise();

    this.pushTask(task);

    return promise;
  }

  /**
   * gera o identificador da tarefa
   */
  generateTaskId(): string {
    return uuidv4();
  }
}
