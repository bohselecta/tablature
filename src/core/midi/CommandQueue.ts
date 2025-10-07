// Command queue to prevent MIDI buffer overflow
export class CommandQueue {
  private queue: (() => Promise<void>)[] = [];
  private processing: boolean = false;
  private delayBetweenCommands: number = 10; // milliseconds
  
  add(command: () => Promise<void>): void {
    this.queue.push(command);
    if (!this.processing) {
      this.process();
    }
  }
  
  private async process(): Promise<void> {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const command = this.queue.shift();
      if (command) {
        try {
          await command();
          await this.delay(this.delayBetweenCommands);
        } catch (error) {
          console.error('Command failed:', error);
        }
      }
    }
    
    this.processing = false;
  }
  
  clear(): void {
    this.queue = [];
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
