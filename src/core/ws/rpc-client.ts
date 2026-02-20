type DeferredPromise<T = any> = {
  resolve: (val: T) => void;
  reject: (err: any) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class OpenClawRPC {
  private ws: WebSocket | null = null;
  private reqId = 1;
  private pending = new Map<number, DeferredPromise>();
  private listeners = new Map<string, Set<(data: any) => void>>();
  private reconnectAttempts = 0;
  private maxReconnect = 5;
  private reconnectDelay = 3000;
  private url = "";
  private token = "";
  private intentionalClose = false;

  connect(url: string, token: string): Promise<void> {
    this.url = url;
    this.token = token;
    this.intentionalClose = false;
    return this._connect();
  }

  private _connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sep = this.url.includes("?") ? "&" : "?";
      this.ws = new WebSocket(`${this.url}${sep}token=${this.token}`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.triggerEvent("_connection", { status: "connected" });
        resolve();
      };

      this.ws.onerror = () => {
        reject(new Error("WebSocket connection failed"));
      };

      this.ws.onclose = () => {
        this.triggerEvent("_connection", { status: "disconnected" });
        if (!this.intentionalClose && this.reconnectAttempts < this.maxReconnect) {
          this.reconnectAttempts++;
          setTimeout(() => this._connect().catch(() => {}), this.reconnectDelay);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Response to a request
          if (data.id && this.pending.has(data.id)) {
            const deferred = this.pending.get(data.id)!;
            clearTimeout(deferred.timer);
            if (data.error) {
              deferred.reject(data.error);
            } else {
              deferred.resolve(data.result);
            }
            this.pending.delete(data.id);
          }
          // Push notification from gateway
          else if (data.method) {
            this.triggerEvent(data.method, data.params);
          }
        } catch {
          // ignore parse errors
        }
      };
    });
  }

  request<T = any>(method: string, params: Record<string, any> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error("Not connected"));
      }
      const id = this.reqId++;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, 30000);

      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
    });
  }

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private triggerEvent(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  disconnect() {
    this.intentionalClose = true;
    this.pending.forEach((d) => {
      clearTimeout(d.timer);
      d.reject(new Error("Disconnected"));
    });
    this.pending.clear();
    this.ws?.close();
    this.ws = null;
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const rpcClient = new OpenClawRPC();
