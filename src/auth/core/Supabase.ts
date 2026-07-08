import { logger, safeJSONParse } from '@/shared/utils';

// --- types.ts ---
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export interface Identity {
  id: string;
  user_id?: string;
  identity_data?: JsonObject;
  provider?: string;
  created_at?: string;
  last_sign_in_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  role?: string;
  aud?: string;
  app_metadata: JsonObject & { provider?: string };
  user_metadata: JsonObject;
  factors?: Factor[];
  identities?: Identity[];
  last_sign_in_at?: string;
}

export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  refresh_token: string;
  user: User;
}

export interface AuthError {
  name: string;
  message: string;
  status?: number;
}

export interface AuthResponse {
  data: { user: User | null; session: Session | null };
  error: AuthError | null;
}

export interface SessionResponse {
  data: { session: Session | null };
  error: AuthError | null;
}

export interface UserResponse {
  data: { user: User | null };
  error: AuthError | null;
}

export interface Factor {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'verified' | 'unverified';
  friendly_name?: string;
  factor_type: 'totp' | string;
}

export interface AuthMFAEnrollResponse {
  data: {
    id: string;
    type: 'totp';
    totp: {
      qr_code: string;
      secret: string;
      uri: string;
    };
  } | null;
  error: AuthError | null;
}

export interface AuthMFAChallengeResponse {
  data: {
    id: string;
    expires_at: string;
  } | null;
  error: AuthError | null;
}

export interface AuthMFAVerifyResponse {
  data: unknown | null;
  error: AuthError | null;
}

export interface AuthMFAListFactorsResponse {
  data: {
    all: Factor[];
    totp: Factor[];
  } | null;
  error: AuthError | null;
}

export interface AuthMFAUnenrollResponse {
  data: unknown | null;
  error: AuthError | null;
}

export interface AuthenticatorAssuranceLevel {
  currentLevel: 'aal1' | 'aal2' | string;
  nextLevel: 'aal1' | 'aal2' | string;
  currentAuthenticationMethods: Array<{ method: string; timestamp: number }>;
}

export interface AuthMFAGetAuthenticatorAssuranceLevelResponse {
  data: AuthenticatorAssuranceLevel | null;
  error: AuthError | null;
}

export interface PostgrestError {
  message: string;
  details: string;
  hint: string;
  code: string;
  status?: number;
}

export interface PostgrestResponse<T> {
  data: T | null;
  error: PostgrestError | null;
  count?: number | null;
  status?: number;
  statusText?: string;
}

// --- fetch.ts ---

function readField(body: unknown, key: string): string | undefined {
  if (body && typeof body === 'object' && key in body) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === 'string') return value;
  }
  return undefined;
}

export class FetchClient {
  constructor(
    public url: string,
    public anonKey: string
  ) {}

  private session: Session | null = null;

  setSession(session: Session | null) {
    this.session = session;
  }

  getSession(): Session | null {
    return this.session;
  }

  getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      apikey: this.anonKey,
      'Content-Type': 'application/json',
      ...customHeaders
    };

    if (this.session?.access_token) {
      headers['Authorization'] = `Bearer ${this.session.access_token}`;
    } else {
      headers['Authorization'] = `Bearer ${this.anonKey}`;
    }

    return headers;
  }

  async request<T>(
    path: string,
    method: string,
    body?: JsonValue,
    customHeaders?: Record<string, string>
  ): Promise<{
    data: T | null;
    error: PostgrestError | null;
    response: Response;
  }> {
    try {
      const isAbsolute = path.startsWith('http');
      const fullUrl = isAbsolute ? path : `${this.url}${path}`;

      const response = await fetch(fullUrl, {
        method,
        headers: this.getHeaders(customHeaders),
        body: body ? JSON.stringify(body) : null
      });

      const isNoContent = response.status === 204;

      let data: unknown = null;
      if (!isNoContent) {
        const text = await response.text();
        if (text) {
          data = safeJSONParse<unknown>(text, text);
        }
      }

      if (!response.ok) {
        const errorMsg =
          readField(data, 'message') ??
          readField(data, 'error_description') ??
          readField(data, 'msg') ??
          'An error occurred';
        return {
          data: null,
          error: {
            message: errorMsg,
            status: response.status,
            code: readField(data, 'code') ?? '',
            details: readField(data, 'details') ?? '',
            hint: readField(data, 'hint') ?? ''
          },
          response
        };
      }

      return { data: data as T, error: null, response };
    } catch (err: unknown) {
      logger.error(`FetchClient error on ${method} ${path}:`, err);
      const message = err instanceof Error ? err.message : 'Network Error';
      return {
        data: null,
        error: { message, status: 0, code: '', details: '', hint: '' },
        response: new Response(null, { status: 0 })
      };
    }
  }

  get<T>(path: string, headers?: Record<string, string>) {
    return this.request<T>(path, 'GET', undefined, headers);
  }

  post<T>(path: string, body?: JsonValue, headers?: Record<string, string>) {
    return this.request<T>(path, 'POST', body, headers);
  }

  patch<T>(path: string, body?: JsonValue, headers?: Record<string, string>) {
    return this.request<T>(path, 'PATCH', body, headers);
  }

  delete<T>(path: string, body?: JsonValue, headers?: Record<string, string>) {
    return this.request<T>(path, 'DELETE', body, headers);
  }
}

// --- postgrest.ts ---

type Row = JsonObject;
type RowInput = Row | Row[];

class PostgrestFilterBuilder<T> {
  protected params = new URLSearchParams();

  constructor(
    protected fetchClient: FetchClient,
    protected table: string,
    protected method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    protected body?: RowInput,
    protected headers: Record<string, string> = {}
  ) {}

  withParams(params: URLSearchParams): this {
    params.forEach((value, key) => this.params.set(key, value));
    return this;
  }

  select(columns: string = '*') {
    this.method = 'GET';
    this.params.set('select', columns);
    return this;
  }

  eq(column: string, value: string | number | boolean) {
    this.params.append(column, `eq.${value}`);
    return this;
  }

  order(
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean }
  ) {
    const asc = options?.ascending ?? true;
    const nulls = options?.nullsFirst ? 'nullsfirst' : 'nullslast';
    this.params.append('order', `${column}.${asc ? 'asc' : 'desc'}.${nulls}`);
    return this;
  }

  limit(count: number) {
    this.params.append('limit', count.toString());
    return this;
  }

  returns<U>() {
    return this as unknown as PostgrestFilterBuilder<U>;
  }

  async maybeSingle<U = T>(): Promise<PostgrestResponse<U>> {
    this.headers['Accept'] = 'application/json';

    if (this.method === 'GET' && !this.params.has('limit')) {
      this.params.set('limit', '1');
    }

    const { data, error, response } = await this.executeRequest<U[]>();

    if (error)
      return {
        data: null,
        error,
        status: response.status,
        statusText: response.statusText
      };

    if (Array.isArray(data) && data.length > 0) {
      return {
        data: (data[0] !== undefined ? data[0] : null) as U | null,
        error: null,
        status: response.status,
        statusText: response.statusText
      };
    }

    return {
      data: null,
      error: null,
      status: response.status,
      statusText: response.statusText
    };
  }

  async single<U = T>(): Promise<PostgrestResponse<U>> {
    this.headers['Accept'] = 'application/vnd.pgrst.object+json';
    const { data, error, response } = await this.executeRequest<U>();
    return {
      data,
      error,
      status: response.status,
      statusText: response.statusText
    };
  }

  protected async executeRequest<U = T>(): Promise<{
    data: U | null;
    error: PostgrestError | null;
    response: Response;
  }> {
    const qs = this.params.toString();
    const path = `/rest/v1/${this.table}${qs ? `?${qs}` : ''}`;

    return this.fetchClient.request<U>(
      path,
      this.method,
      this.body,
      this.headers
    );
  }

  then<TResult1 = PostgrestResponse<T>, TResult2 = never>(
    onfulfilled?:
      | ((value: PostgrestResponse<T>) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): Promise<TResult1 | TResult2> {
    return this.executeRequest<T>().then((res) => {
      const value: PostgrestResponse<T> = {
        data: res.data,
        error: res.error,
        status: res.response.status
      };
      return onfulfilled ? onfulfilled(value) : (value as unknown as TResult1);
    }, onrejected);
  }
}

export class PostgrestQueryBuilder {
  constructor(
    private fetchClient: FetchClient,
    private table: string
  ) {}

  select(columns: string = '*') {
    return new PostgrestFilterBuilder<Row[]>(
      this.fetchClient,
      this.table,
      'GET'
    ).select(columns);
  }

  insert(
    values: RowInput,
    options?: { returning?: 'minimal' | 'representation' }
  ) {
    const headers: Record<string, string> = {};
    if (options?.returning === 'minimal') headers['Prefer'] = 'return=minimal';
    else headers['Prefer'] = 'return=representation';

    return new PostgrestFilterBuilder<Row>(
      this.fetchClient,
      this.table,
      'POST',
      values,
      headers
    );
  }

  upsert(values: RowInput, options?: { onConflict?: string }) {
    const headers: Record<string, string> = {
      Prefer: 'resolution=merge-duplicates'
    };

    const builder = new PostgrestFilterBuilder<Row>(
      this.fetchClient,
      this.table,
      'POST',
      values,
      headers
    );
    if (options?.onConflict) {
      const params = new URLSearchParams();
      params.set('on_conflict', options.onConflict);
      builder.withParams(params);
    }
    return builder;
  }

  update(values: Row) {
    const headers: Record<string, string> = { Prefer: 'return=representation' };
    return new PostgrestFilterBuilder<Row>(
      this.fetchClient,
      this.table,
      'PATCH',
      values,
      headers
    );
  }

  delete() {
    const headers: Record<string, string> = { Prefer: 'return=representation' };
    return new PostgrestFilterBuilder<Row>(
      this.fetchClient,
      this.table,
      'DELETE',
      undefined,
      headers
    );
  }
}

// --- functions.ts ---

export class FunctionsClient {
  constructor(private fetchClient: FetchClient) {}

  async invoke<T>(
    name: string,
    options?: { body?: JsonValue }
  ): Promise<{ data: T | null; error: PostgrestError | null }> {
    const { data, error } = await this.fetchClient.post<T>(
      `/functions/v1/${name}`,
      options?.body
    );
    return { data, error };
  }
}

export class RpcClient {
  constructor(private fetchClient: FetchClient) {}

  async call<T = unknown>(
    fn: string,
    args?: JsonValue
  ): Promise<{ data: T | null; error: PostgrestError | null }> {
    const { data, error } = await this.fetchClient.post<T>(
      `/rest/v1/rpc/${fn}`,
      args
    );
    return { data, error };
  }
}

// --- auth.ts ---

const STORAGE_KEY = 'sb-chess-vision-auth-token';

function toAuthError(error: PostgrestError | null): AuthError | null {
  if (!error) return null;
  const name =
    error.status === 401 || error.status === 403
      ? 'AuthApiError'
      : 'AuthUnknownError';
  return {
    name,
    message: error.message,
    ...(error.status !== undefined ? { status: error.status } : {})
  };
}

type AuthStateChangeCallback = (event: string, session: Session | null) => void;

interface JwtPayload {
  exp?: number;
  aal?: 'aal1' | 'aal2';
  amr?: Array<{ method: string; timestamp: number }>;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: User;
}

function decodeUnverifiedJwtPayload(
  accessToken: string | undefined
): JwtPayload | null {
  const segment = accessToken?.split('.')[1];
  if (!segment) return null;
  let decoded: string;
  try {
    decoded = atob(segment);
  } catch {
    return null;
  }
  return safeJSONParse<JwtPayload | null>(decoded, null);
}

export class AuthClient {
  private listeners = new Set<AuthStateChangeCallback>();

  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private visibilityHandler: () => void;

  constructor(private fetchClient: FetchClient) {
    this.visibilityHandler = () => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible'
      ) {
        void this.checkAndRefreshSession();
      }
    };
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
    this.recoverSession();
  }

  private persistSession(session: Session | null) {
    if (typeof window === 'undefined') return;
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private recoverSession() {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const session = safeJSONParse<Session | null>(stored, null);
    if (!session) {
      logger.error('Failed to parse stored session');
      return;
    }

    this.fetchClient.setSession(session);
    this.notifyListeners('INITIAL_SESSION', session);
    this.startAutoRefresh(session);
    void this.checkAndRefreshSession();
  }

  private notifyListeners(event: string, session: Session | null) {
    this.listeners.forEach((fn) => {
      try {
        fn(event, session);
      } catch (e) {
        logger.error('Auth listener error:', e);
      }
    });
  }

  private handleSessionUpdate(session: Session | null, event: string) {
    this.fetchClient.setSession(session);
    this.persistSession(session);
    this.startAutoRefresh(session);
    this.notifyListeners(event, session);
  }

  private startAutoRefresh(session: Session | null) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (!session?.access_token || !session?.refresh_token) return;

    const payload = decodeUnverifiedJwtPayload(session.access_token);
    if (!payload) {
      logger.warn(
        'startAutoRefresh: could not decode token, no refresh scheduled'
      );
      return;
    }
    if (payload.exp) {
      const timeToExpiry = payload.exp * 1000 - Date.now();
      const refreshTime = Math.max(0, timeToExpiry - 60000);
      this.refreshTimer = setTimeout(
        () => void this.checkAndRefreshSession(),
        refreshTime
      );
    }
  }

  private async checkAndRefreshSession() {
    const session = this.fetchClient.getSession();
    if (!session?.refresh_token) return;

    const payload = decodeUnverifiedJwtPayload(session.access_token);
    if (payload?.exp) {
      const timeToExpiry = payload.exp * 1000 - Date.now();
      if (timeToExpiry > 60000) {
        this.startAutoRefresh(session);
        return;
      }
    }

    const { data, error } = await this.fetchClient.post<TokenResponse>(
      '/auth/v1/token?grant_type=refresh_token',
      {
        refresh_token: session.refresh_token
      }
    );

    if (error || !data?.access_token) {
      logger.warn('Token refresh failed', error);
      this.handleSessionUpdate(null, 'SIGNED_OUT');
      return;
    }

    const newSession: Session = {
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
      user: data.user
    };

    this.handleSessionUpdate(newSession, 'TOKEN_REFRESHED');
  }

  onAuthStateChange(callback: AuthStateChangeCallback) {
    this.listeners.add(callback);
    callback('INITIAL_SESSION', this.fetchClient.getSession());
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback);
          }
        }
      }
    };
  }

  async getSession(): Promise<SessionResponse> {
    const session = this.fetchClient.getSession();
    return { data: { session }, error: null };
  }

  getCurrentSession(): Session | null {
    return this.fetchClient.getSession();
  }

  async getUser(): Promise<UserResponse> {
    const session = this.fetchClient.getSession();
    if (!session?.access_token)
      return {
        data: { user: null },
        error: {
          name: 'AuthSessionMissingError',
          message: 'Auth session missing!'
        }
      };

    const { data, error } = await this.fetchClient.get<User>('/auth/v1/user');
    if (error) return { data: { user: null }, error: toAuthError(error) };
    return { data: { user: data }, error: null };
  }

  async signUp(credentials: {
    email: string;
    password?: string;
    options?: { data?: JsonObject; emailRedirectTo?: string };
  }): Promise<AuthResponse> {
    const { data, error } = await this.fetchClient.post<SignUpResponse>(
      '/auth/v1/signup',
      credentials
    );
    if (error)
      return { data: { user: null, session: null }, error: toAuthError(error) };

    const session = data?.session ?? null;
    const user = data?.user ?? data ?? null;

    if (session) {
      this.handleSessionUpdate(session, 'SIGNED_IN');
    }
    return { data: { user, session }, error: null };
  }

  async signInWithPassword(credentials: {
    email: string;
    password?: string;
  }): Promise<AuthResponse> {
    const { data, error } = await this.fetchClient.post<TokenResponse>(
      '/auth/v1/token?grant_type=password',
      credentials
    );
    if (error || !data)
      return { data: { user: null, session: null }, error: toAuthError(error) };

    const session: Session = {
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
      user: data.user
    };

    this.handleSessionUpdate(session, 'SIGNED_IN');
    return { data: { user: session.user, session }, error: null };
  }

  async signOut(options?: {
    scope?: string;
  }): Promise<{ error: AuthError | null }> {
    const session = this.fetchClient.getSession();
    if (session?.access_token) {
      const scope = options?.scope === 'global' ? 'global' : 'local';
      await this.fetchClient.post(`/auth/v1/logout?scope=${scope}`);
    }
    this.handleSessionUpdate(null, 'SIGNED_OUT');
    return { error: null };
  }

  async resetPasswordForEmail(
    email: string,
    options?: { redirectTo?: string }
  ): Promise<{ data: unknown; error: AuthError | null }> {
    const { data, error } = await this.fetchClient.post(
      '/auth/v1/recover',
      { email, gotrue_meta_security: {} },
      options?.redirectTo ? { 'redirect-to': options.redirectTo } : undefined
    );
    return { data, error: toAuthError(error) };
  }

  async updateUser(attributes: {
    email?: string;
    password?: string;
    data?: JsonObject;
  }): Promise<UserResponse> {
    const { data, error } = await this.fetchClient.patch<User>(
      '/auth/v1/user',
      attributes
    );
    if (error) return { data: { user: null }, error: toAuthError(error) };

    const session = this.fetchClient.getSession();
    if (session && data) {
      session.user = data;
      this.handleSessionUpdate(session, 'USER_UPDATED');
    }
    return { data: { user: data }, error: null };
  }

  public mfa = {
    listFactors: async (): Promise<AuthMFAListFactorsResponse> => {
      const { data: userData, error } = await this.getUser();
      if (error) return { data: null, error };
      const all = userData.user?.factors ?? [];
      const totp = all.filter(
        (f) => f.factor_type === 'totp' && f.status === 'verified'
      );
      return { data: { all, totp }, error: null };
    },
    challenge: async (params: {
      factorId: string;
    }): Promise<AuthMFAChallengeResponse> => {
      const { data, error } = await this.fetchClient.post<
        AuthMFAChallengeResponse['data']
      >(`/auth/v1/factors/${params.factorId}/challenge`);
      return { data, error: toAuthError(error) };
    },
    verify: async (params: {
      factorId: string;
      challengeId: string;
      code: string;
    }): Promise<AuthMFAVerifyResponse> => {
      const { data, error } = await this.fetchClient.post<TokenResponse>(
        `/auth/v1/factors/${params.factorId}/verify`,
        {
          challenge_id: params.challengeId,
          code: params.code
        }
      );
      if (!error && data?.access_token) {
        const newSession: Session = {
          access_token: data.access_token,
          token_type: data.token_type,
          expires_in: data.expires_in,
          refresh_token: data.refresh_token,
          user: data.user
        };
        this.handleSessionUpdate(newSession, 'MFA_CHALLENGE_VERIFIED');
      }
      return { data, error: toAuthError(error) };
    },
    enroll: async (params: {
      factorType: 'totp';
      issuer?: string;
      friendlyName?: string;
    }): Promise<AuthMFAEnrollResponse> => {
      const { data, error } = await this.fetchClient.post<
        AuthMFAEnrollResponse['data']
      >('/auth/v1/factors', {
        factor_type: params.factorType,
        issuer: params.issuer || 'ChessViewer',
        ...(params.friendlyName ? { friendly_name: params.friendlyName } : {})
      });
      return { data, error: toAuthError(error) };
    },
    unenroll: async (params: {
      factorId: string;
    }): Promise<AuthMFAUnenrollResponse> => {
      const { data, error } = await this.fetchClient.delete<
        AuthMFAUnenrollResponse['data']
      >(`/auth/v1/factors/${params.factorId}`);
      return { data, error: toAuthError(error) };
    },
    getAuthenticatorAssuranceLevel:
      async (): Promise<AuthMFAGetAuthenticatorAssuranceLevelResponse> => {
        const session = this.fetchClient.getSession();
        if (!session)
          return {
            data: null,
            error: { name: 'AuthSessionMissingError', message: 'No session' }
          };

        const payload = decodeUnverifiedJwtPayload(session.access_token);
        let aal: 'aal1' | 'aal2' = 'aal1';
        if (payload?.aal) aal = payload.aal;

        let nextLevel: 'aal1' | 'aal2' = aal;
        const { data: userData, error: userError } = await this.getUser();
        if (userError) return { data: null, error: userError };
        const verifiedFactors =
          userData.user?.factors?.filter((f) => f.status === 'verified') ?? [];
        if (verifiedFactors.length > 0) {
          nextLevel = 'aal2';
        }

        const currentAuthenticationMethods = payload?.amr ?? [];

        return {
          data: {
            currentLevel: aal,
            nextLevel,
            currentAuthenticationMethods
          },
          error: null
        };
      }
  };
}

type SignUpResponse = User & {
  user?: User | null;
  session?: Session | null;
};

// --- index.ts ---

let supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  logger.warn(
    'VITE_SUPABASE_URL is missing or invalid. Falling back to a placeholder URL.',
    'Authentication will not work until you configure your .env.local file with a valid URL (e.g., https://xxx.supabase.co).'
  );
  supabaseUrl = 'https://placeholder.supabase.co';
}

class SupabaseClient {
  private fetchClient: FetchClient;
  public auth: AuthClient;
  public functions: FunctionsClient;
  private rpcClient: RpcClient;

  constructor(url: string, key: string) {
    this.fetchClient = new FetchClient(url, key);
    this.auth = new AuthClient(this.fetchClient);
    this.functions = new FunctionsClient(this.fetchClient);
    this.rpcClient = new RpcClient(this.fetchClient);
  }

  from(table: string) {
    return new PostgrestQueryBuilder(this.fetchClient, table);
  }

  rpc<T = unknown>(fn: string, args?: JsonValue) {
    return this.rpcClient.call<T>(fn, args);
  }
}

export const supabase = new SupabaseClient(supabaseUrl, supabaseAnonKey);

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Authentication failed. Please try again.';
}
