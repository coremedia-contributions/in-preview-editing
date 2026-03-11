import { Observable, Subject, fromEvent, of, throwError } from "rxjs";
import { filter, map, mergeMap, share, take, takeUntil, timeout } from "rxjs/operators";

export interface PostMessageEnvelope<TBody = unknown> {
  channel?: string;
  type: string;
  requestId?: string;
  replyTo?: string;
  body?: TBody;
  error?: string | { message: string; code?: string; details?: unknown };
}

export interface PostMessageBridgeOptions {
  channel: string;
  targetWindow?: Window;
  targetOrigin?: string;
  allowedOrigins?: readonly string[];
  acceptMessagesWithoutChannel?: boolean;
}

export interface RequestOptions {
  timeoutMs?: number;
  responseType?: string;
  requestId?: string;
  /**
   * Set to true for legacy backends that do not echo a correlationId /
   * replyTo field in their response. The response is then matched solely
   * by responseType – the first matching message wins.
   */
  skipCorrelation?: boolean;
}

const DEFAULT_TIMEOUT_MS = 5000;

export class PostMessageRxBridge {
  private readonly channel: string;
  private readonly targetWindow: Window;
  private readonly targetOrigin: string;
  private readonly allowedOrigins: Set<string> | null;
  private readonly acceptMessagesWithoutChannel: boolean;
  private readonly destroy$ = new Subject<void>();
  private readonly incomingMessages$: Observable<PostMessageEnvelope<unknown>>;

  constructor({
    channel,
    targetWindow = window.parent,
    targetOrigin = "*",
    allowedOrigins,
    acceptMessagesWithoutChannel = false,
  }: PostMessageBridgeOptions) {
    this.channel = channel;
    this.targetWindow = targetWindow;
    this.targetOrigin = targetOrigin;
    this.allowedOrigins = allowedOrigins && allowedOrigins.length > 0 ? new Set(allowedOrigins) : null;
    this.acceptMessagesWithoutChannel = acceptMessagesWithoutChannel;

    this.incomingMessages$ = fromEvent<MessageEvent>(window, "message").pipe(
      takeUntil(this.destroy$),
      filter((event) => this.isAllowedOrigin(event.origin)),
      map((event) => this.tryParseEnvelope(event.data)),
      filter((envelope): envelope is PostMessageEnvelope<unknown> => envelope !== null),
      share(),
    );
  }

  messages<TBody = unknown>(): Observable<PostMessageEnvelope<TBody>> {
    return this.incomingMessages$ as Observable<PostMessageEnvelope<TBody>>;
  }

  on<TBody = unknown>(type: string): Observable<PostMessageEnvelope<TBody>> {
    return this.incomingMessages$.pipe(
      filter((envelope): envelope is PostMessageEnvelope<TBody> => envelope.type === type),
    );
  }

  send<TBody = unknown>(type: string, body?: TBody, requestId?: string): PostMessageEnvelope<TBody> {
    const envelope: PostMessageEnvelope<TBody> = {
      channel: this.channel,
      type,
      body,
      requestId,
    };

    this.targetWindow.postMessage(JSON.stringify(envelope), this.targetOrigin);
    return envelope;
  }

  request<TRequest = unknown, TResponse = unknown>(
    type: string,
    body?: TRequest,
    { timeoutMs = DEFAULT_TIMEOUT_MS, responseType = `${type}.response`, requestId = this.createRequestId(), skipCorrelation = false }: RequestOptions = {},
  ): Observable<TResponse> {
    this.send(type, body, skipCorrelation ? undefined : requestId);

    return this.incomingMessages$.pipe(
      filter((envelope) =>
        skipCorrelation
          ? envelope.type === responseType
          : envelope.type === responseType && envelope.replyTo === requestId,
      ),
      take(1),
      timeout({ first: timeoutMs }),
      mergeMap((envelope) => {
        if (envelope.error) {
          return throwError(() => new Error(this.formatError(envelope.error)));
        }

        return of(envelope.body as TResponse);
      }),
    );
  }

  respond<TRequestBody = unknown, TResponseBody = unknown>(
    requestEnvelope: PostMessageEnvelope<TRequestBody>,
    responseType: string,
    body?: TResponseBody,
    error?: PostMessageEnvelope["error"],
  ): PostMessageEnvelope<TResponseBody> {
    if (!requestEnvelope.requestId) {
      throw new Error("Cannot respond to message without requestId.");
    }

    const responseEnvelope: PostMessageEnvelope<TResponseBody> = {
      channel: this.channel,
      type: responseType,
      replyTo: requestEnvelope.requestId,
      body,
      error,
    };

    this.targetWindow.postMessage(JSON.stringify(responseEnvelope), this.targetOrigin);
    return responseEnvelope;
  }

  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private isAllowedOrigin(origin: string): boolean {
    if (this.allowedOrigins) {
      return this.allowedOrigins.has(origin);
    }

    if (this.targetOrigin === "*") {
      return true;
    }

    return this.targetOrigin === origin;
  }

  private tryParseEnvelope(data: unknown): PostMessageEnvelope<unknown> | null {
    const parsed = this.parseMessageData(data);
    if (!parsed || typeof parsed.type !== "string") {
      return null;
    }

    const parsedChannel = typeof parsed.channel === "string" ? parsed.channel : undefined;

    if (parsedChannel === this.channel) {
      return parsed;
    }

    if (this.acceptMessagesWithoutChannel && parsedChannel === undefined) {
      return parsed;
    }

    return null;
  }

  private parseMessageData(data: unknown): PostMessageEnvelope<unknown> | null {
    if (typeof data === "string") {
      try {
        return JSON.parse(data) as PostMessageEnvelope<unknown>;
      } catch {
        return null;
      }
    }

    if (typeof data === "object" && data !== null) {
      return data as PostMessageEnvelope<unknown>;
    }

    return null;
  }

  private createRequestId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private formatError(error: PostMessageEnvelope["error"]): string {
    if (!error) {
      return "Unknown postMessage error.";
    }

    if (typeof error === "string") {
      return error;
    }

    return error.message;
  }
}

