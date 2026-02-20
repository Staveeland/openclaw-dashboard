type DeferredPromise<T = any> = {
  resolve: (val: T) => void;
  reject: (err: any) => void;
  timer: ReturnType<typeof setTimeout>;
};

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export class OpenClawRPC {
  private ws: WebSocket | null = null;
  private pending = new Map<string, DeferredPromise>();
  private listeners = new Map<string, Set<(data: any) => void>>();
  private reconnectAttempts = 0;
  private maxReconnect = 5;
  private reconnectDelay = 3000;
  private url = "";
  private token = "";
  private intentionalClose = false;
  private connectNonce: string | null = null;
  private authenticated = false;
  private instanceId = uuid();

  connect(url: string, token: string): Promise<void> {
    this.url = url;
    this.token = token;
    this.intentionalClose = false;
    this.authenticated = false;
    return this._connect();
  }

  private _connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Connect without token in URL - auth happens via connect handshake
      this.ws = new WebSocket(this.url);
      let resolved = false;

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        // Don't resolve yet - wait for auth handshake
      };

      this.ws.onerror = () => {
        if (!resolved) {
          resolved = true;
          reject(new Error("WebSocket connection failed"));
        }
      };

      this.ws.onclose = () => {
        this.authenticated = false;
        this.triggerEvent("_connection", { status: "disconnected" });
        if (!this.intentionalClose && this.reconnectAttempts < this.maxReconnect) {
          this.reconnectAttempts++;
          setTimeout(() => this._connect().catch(() => {}), this.reconnectDelay);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          // Handle events
          if (msg.type === "event") {
            if (msg.event === "connect.challenge") {
              // Gateway sends nonce, we respond with connect RPC
              const nonce = msg.payload?.nonce;
              this.connectNonce = nonce ?? null;
              this._sendConnect()
                .then((hello) => {
                  this.authenticated = true;
                  this.triggerEvent("_connection", { status: "connected" });
                  this.triggerEvent("_hello", hello);
                  if (!resolved) {
                    resolved = true;
                    resolve();
                  }
                })
                .catch((err) => {
                  if (!resolved) {
                    resolved = true;
                    reject(err);
                  }
                  this.ws?.close(4008, "connect failed");
                });
              return;
            }
            // Forward other events to listeners
            this.triggerEvent(msg.event, msg.payload);
            return;
          }

          // Handle RPC responses
          if (msg.type === "res") {
            const deferred = this.pending.get(msg.id);
            if (!deferred) return;
            this.pending.delete(msg.id);
            clearTimeout(deferred.timer);
            if (msg.ok) {
              deferred.resolve(msg.payload);
            } else {
              deferred.reject(new Error(msg.error?.message ?? "request failed"));
            }
            return;
          }
        } catch {
          // ignore parse errors
        }
      };
    });
  }

  private _sendConnect(): Promise<any> {
    const params: any = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: "openclaw-control-ui",
        version: "0.1.0",
        platform: typeof navigator !== "undefined" ? navigator.platform : "web",
        mode: "ui",
        instanceId: this.instanceId,
      },
      role: "operator",
      scopes: ["operator.admin"],
      caps: [],
      auth: {
        token: this.token || undefined,
      },
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "openclaw-dashboard",
      locale: typeof navigator !== "undefined" ? navigator.language : "en",
    };
    return this._rawRequest("connect", params);
  }

  /** Low-level request that works before auth (used for connect handshake) */
  private _rawRequest<T = any>(method: string, params: Record<string, any> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error("Not connected"));
      }
      const id = uuid();
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, 30000);

      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ type: "req", id, method, params }));
    });
  }

  request<T = any>(method: string, params: Record<string, any> = {}): Promise<T> {
    if (!this.authenticated) {
      return Promise.reject(new Error("Not authenticated"));
    }
    return this._rawRequest(method, params);
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
    this.authenticated = false;
    this.pending.forEach((d) => {
      clearTimeout(d.timer);
      d.reject(new Error("Disconnected"));
    });
    this.pending.clear();
    this.ws?.close();
    this.ws = null;
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.authenticated;
  }
}

export const rpcClient = new OpenClawRPC();
