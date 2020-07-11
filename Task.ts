import puppeteer from "puppeteer";

export type Func<T> = (browser: puppeteer.Browser) => Promise<T>;

export enum TaskStatus {
  PENDING = "PENDING",
  EXECUTING = "EXECUTING",
  FINISHED = "FINISHED",
}

export default class Task<T> {
  private id: string;
  private description?: string;
  private status: TaskStatus;
  private func: Func<T>;
  private promise: Promise<T>;

  constructor(id: string, func: Func<T>, description?: string) {
    this.id = id;
    this.status = TaskStatus.PENDING;
    this.func = func;
    this.description = description;
    this.promise = this.createPromise();
  }

  getId(): string {
    return this.id;
  }

  getPromise(): Promise<T> {
    return this.promise;
  }

  getTaskDescription() {
    const taskDesc = `${this.id}${
      this.description ? `{ ${this.description} }` : ""
    }...`;
    return taskDesc;
  }

  async run(browser: puppeteer.Browser) {
    try {
      this.status = TaskStatus.EXECUTING;
      const result = await this.func(browser);
      this.resolvePromise(result);
      this.status = TaskStatus.FINISHED;
    } catch (err) {
      this.rejectPromise(err);
    }
  }

  private resolvePromise(result: T) {}
  private rejectPromise(err: any) {}

  createPromise(): Promise<T> {
    const promise = new Promise<any>((accept, reject) => {
      this.resolvePromise = accept;
      this.rejectPromise = reject;
    });
    return promise;
  }
}
