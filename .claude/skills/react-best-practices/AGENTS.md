# Vercel React Best Practices — Full Rules

**Version 1.0.0 | Vercel Engineering**
**Project adaptation**: Next.js-specific rules marked `[NEXT.JS ONLY]`

> Follow these rules when writing, reviewing, or refactoring React components in this project.

---

## Category 1: Eliminating Waterfalls — CRITICAL

### 1.1 Defer Await Until Needed (`async-defer-await`)
Move `await` into the branches where it is actually used. Don't block code paths that don't need the result.

```typescript
// ❌ Bad — always awaits even if condition skips usage
async function getUser(id: string) {
  const user = await fetchUser(id); // blocks even if not needed
  if (!user) return null;
  return user;
}

// ✅ Good — await only where needed
async function getUser(id: string) {
  const userPromise = fetchUser(id);
  // ... other work
  const user = await userPromise;
  if (!user) return null;
  return user;
}
```

### 1.2 Dependency-Based Parallelization (`async-parallel`)
For independent async operations, use `Promise.all()`. Start all promises before awaiting any.

```typescript
// ❌ Bad — sequential (waterfall)
const user = await fetchUser(id);
const posts = await fetchPosts(id);
const settings = await fetchSettings(id);

// ✅ Good — parallel
const [user, posts, settings] = await Promise.all([
  fetchUser(id),
  fetchPosts(id),
  fetchSettings(id),
]);
```

### 1.3 Prevent Waterfall Chains (`async-dependencies`)
In async functions, start independent operations immediately even if you don't await them yet.

```typescript
// ❌ Bad — sequential when only partially dependent
const session = await auth();
const config = await fetchConfig();
const data = await fetchData(session.user.id);

// ✅ Good — maximize parallelism
const sessionPromise = auth();
const configPromise = fetchConfig();
const session = await sessionPromise;
const [config, data] = await Promise.all([
  configPromise,
  fetchData(session.user.id),
]);
```

### 1.4 Strategic Suspense Boundaries (`async-suspense-boundaries`)
Use Suspense boundaries to show wrapper UI faster while data loads.

```tsx
// ❌ Bad — blocks entire render
async function ChatRoom({ roomId }: { roomId: number }) {
  const messages = await fetchMessages(roomId); // blocks everything
  return <MessageList messages={messages} />;
}

// ✅ Good — show layout immediately, stream data
function ChatRoom({ roomId }: { roomId: number }) {
  return (
    <div className="chat-layout">
      <Suspense fallback={<MessageSkeleton />}>
        <MessageList roomId={roomId} />
      </Suspense>
    </div>
  );
}
```

---

## Category 2: Bundle Size Optimization — CRITICAL

### 2.1 Avoid Barrel File Imports (`bundle-barrel-imports`)
Import directly from source files, not barrel index files. Barrel files can import thousands of modules unnecessarily.

```typescript
// ❌ Bad — imports entire library
import { Button, Input } from '@/components';
import { formatDate } from '@/lib';

// ✅ Good — import directly from source
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { formatDate } from '@/lib/date';
```

**High-impact libraries to watch**: `lucide-react`, `@mui/material`, `react-icons`, `lodash`, `date-fns`

```typescript
// ❌ Bad
import { Calendar } from 'lucide-react';

// ✅ Good
import Calendar from 'lucide-react/dist/esm/icons/calendar';
// Or use Vite's tree-shaking with optimizeDeps
```

### 2.2 Dynamic Imports for Heavy Components (`bundle-dynamic-imports`)
Use `React.lazy()` + Suspense for large components not needed on initial render.

```tsx
// ❌ Bad — bundles everything upfront
import { MonacoEditor } from './MonacoEditor';
import { ChartComponent } from './Chart';

// ✅ Good — lazy load on demand
const MonacoEditor = React.lazy(() => import('./MonacoEditor'));
const ChartComponent = React.lazy(() => import('./Chart'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <MonacoEditor />
    </Suspense>
  );
}
```

### 2.3 Conditional Module Loading (`bundle-conditional`)
Load large data/modules only when a feature is activated.

```typescript
// ❌ Bad — always loads heavy module
import { parseMarkdown } from 'heavy-markdown-lib';

// ✅ Good — load on demand
async function handleMarkdownToggle() {
  const { parseMarkdown } = await import('heavy-markdown-lib');
  setContent(parseMarkdown(raw));
}
```

### 2.4 Preload Based on User Intent (`bundle-preload`)
Preload heavy bundles on `onMouseEnter` / `onFocus` to reduce perceived latency.

```tsx
// ✅ Preload on hover intent
function ChatButton() {
  const handleMouseEnter = () => {
    import('./ChatWindow'); // preload, don't await
  };

  return (
    <button onMouseEnter={handleMouseEnter} onClick={openChat}>
      Open Chat
    </button>
  );
}
```

---

## Category 3: Server-Side Performance — HIGH

> ⚠️ **[NEXT.JS ONLY]** — Rules in this category apply to Next.js RSC/Server Actions.
> This project uses NestJS REST API + React client. These rules do not apply directly.
> For NestJS-side caching, see the api-server's service layer.

---

## Category 4: Client-Side Data Fetching — MEDIUM-HIGH

### 4.1 Deduplicate Requests with TanStack Query (`client-swr-dedup`)
This project uses TanStack Query (not SWR). Multiple components using the same query key share one request automatically.

```typescript
// ✅ TanStack Query deduplicates automatically
function ChatHeader({ roomId }: { roomId: number }) {
  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => fetchRoom(roomId),
  });
  return <h1>{room?.name}</h1>;
}

function ChatSidebar({ roomId }: { roomId: number }) {
  // Same queryKey — reuses cached data, no duplicate request
  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => fetchRoom(roomId),
  });
  return <div>{room?.memberCount} members</div>;
}
```

### 4.2 Deduplicate Global Event Listeners (`client-event-listeners`)
Share global event listeners across component instances.

```typescript
// ❌ Bad — N instances = N listeners
function useSocketEvent(event: string) {
  useEffect(() => {
    socket.on(event, handler); // each instance adds its own listener
    return () => socket.off(event, handler);
  }, [event]);
}

// ✅ Good — single shared listener
const listeners = new Map<string, Set<Function>>();

function useSocketEvent(event: string, handler: Function) {
  useEffect(() => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
      socket.on(event, (...args) => listeners.get(event)?.forEach(fn => fn(...args)));
    }
    listeners.get(event)!.add(handler);
    return () => listeners.get(event)?.delete(handler);
  }, [event, handler]);
}
```

### 4.3 Use Passive Event Listeners (`client-passive-event-listeners`)
Add `{ passive: true }` to touch and wheel listeners for scrolling performance.

```typescript
// ❌ Bad — blocks scroll thread
element.addEventListener('touchstart', handler);

// ✅ Good — non-blocking
element.addEventListener('touchstart', handler, { passive: true });
// ⚠️ Do NOT use passive when handler calls e.preventDefault()
```

### 4.4 Version and Validate localStorage Data (`client-localstorage-schema`)

```typescript
// ✅ Good — versioned, safe, minimal
const STORAGE_KEY = 'userSettings:v2';

function loadSettings(): UserSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validate structure
    if (!parsed.theme || !parsed.language) return null;
    return parsed;
  } catch {
    return null; // incognito, quota exceeded, disabled
  }
}
```

---

## Category 5: Re-render Optimization — MEDIUM

### 5.1 Calculate Derived State During Rendering (`rerender-derived-state`)
Don't store computable values in state or effects.

```typescript
// ❌ Bad — redundant state
const [items, setItems] = useState<Item[]>([]);
const [filteredItems, setFilteredItems] = useState<Item[]>([]);

useEffect(() => {
  setFilteredItems(items.filter(i => i.active));
}, [items]);

// ✅ Good — derive during render
const [items, setItems] = useState<Item[]>([]);
const filteredItems = items.filter(i => i.active); // computed, no state
```

### 5.2 Defer State Reads to Usage Point (`rerender-defer-reads`)
Don't subscribe to dynamic state if you only read it inside callbacks.

```typescript
// ❌ Bad — re-renders on every URL change
function SearchButton() {
  const searchParams = useSearchParams(); // subscribes to all changes
  const handleClick = () => {
    const q = searchParams.get('q');
    doSearch(q);
  };
  return <button onClick={handleClick}>Search</button>;
}

// ✅ Good — read on demand
function SearchButton() {
  const handleClick = () => {
    const q = new URLSearchParams(window.location.search).get('q');
    doSearch(q);
  };
  return <button onClick={handleClick}>Search</button>;
}
```

### 5.3 Don't Wrap Simple Primitives in useMemo (`rerender-simple-expression-in-memo`)

```typescript
// ❌ Bad — memo overhead > computation cost
const isActive = useMemo(() => status === 'active', [status]);

// ✅ Good — just compute it
const isActive = status === 'active';
```

### 5.4 Hoist Default Non-Primitive Parameters (`rerender-memo-with-default-value`)

```typescript
// ❌ Bad — new reference on every render, breaks memo()
const MyComponent = memo(({ onClick = () => {} }) => { ... });

// ✅ Good — stable reference
const NOOP = () => {};
const MyComponent = memo(({ onClick = NOOP }) => { ... });
```

### 5.5 Use Memoized Components for Expensive Work (`rerender-memo`)

```typescript
// ✅ Use memo for expensive renders
const MessageList = memo(({ messages }: { messages: Message[] }) => {
  return (
    <div>
      {messages.map(msg => <MessageItem key={msg.id} message={msg} />)}
    </div>
  );
});
// Note: React Compiler (React 19) handles this automatically when enabled
```

### 5.6 Narrow Effect Dependencies (`rerender-dependencies`)

```typescript
// ❌ Bad — re-runs when any user property changes
useEffect(() => {
  if (user.isAdmin) fetchAdminData();
}, [user]); // unstable object reference

// ✅ Good — derive boolean, use primitive dependency
const isAdmin = user.isAdmin;
useEffect(() => {
  if (isAdmin) fetchAdminData();
}, [isAdmin]); // stable primitive
```

### 5.7 Put Interaction Logic in Event Handlers (`rerender-move-effect-to-event`)

```typescript
// ❌ Bad — effect duplicates on unrelated re-renders
const [submitted, setSubmitted] = useState(false);
useEffect(() => {
  if (submitted) sendMessage(message);
}, [submitted]);

// ✅ Good — run on the specific user action
const handleSubmit = () => {
  sendMessage(message); // directly in handler
};
```

### 5.8 Use Functional setState Updates (`rerender-functional-setstate`)

```typescript
// ❌ Bad — stale closure risk
const addMessage = useCallback((msg: Message) => {
  setMessages([...messages, msg]); // captures stale messages
}, [messages]);

// ✅ Good — always uses current state
const addMessage = useCallback((msg: Message) => {
  setMessages(curr => [...curr, msg]);
}, []); // stable, no dependency on messages
```

### 5.9 Use Lazy State Initialization (`rerender-lazy-state-init`)

```typescript
// ❌ Bad — buildIndex() runs on every render
const [index, setIndex] = useState(buildSearchIndex(items));

// ✅ Good — runs only once
const [index, setIndex] = useState(() => buildSearchIndex(items));
```

### 5.10 Use Transitions for Non-Urgent Updates (`rerender-transitions`)

```typescript
// ✅ Mark non-urgent state updates as transitions
const [isPending, startTransition] = useTransition();

const handleSearch = (query: string) => {
  startTransition(() => {
    setResults(filterResults(query)); // non-urgent, won't block input
  });
};
```

### 5.11 Use useRef for Transient Values (`rerender-use-ref-transient-values`)

```typescript
// ❌ Bad — state triggers re-render for tracking-only values
const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

// ✅ Good — ref for values that change without needing re-renders
const mousePosRef = useRef({ x: 0, y: 0 });

useEffect(() => {
  const handleMove = (e: MouseEvent) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };
    // Update DOM directly if needed, no re-render
  };
  window.addEventListener('mousemove', handleMove);
  return () => window.removeEventListener('mousemove', handleMove);
}, []);
```

---

## Category 6: Rendering Performance — MEDIUM

### 6.1 Animate SVG Wrapper, Not SVG Element (`rendering-animate-svg-wrapper`)
Many browsers lack hardware acceleration for CSS animations on SVG elements.

```tsx
// ❌ Bad
<svg className="animate-spin" ... />

// ✅ Good
<div className="animate-spin">
  <svg ... />
</div>
```

### 6.2 Use content-visibility for Long Lists (`rendering-content-visibility`)

```css
/* For chat message lists, history lists */
.message-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px; /* estimated height */
}
```

For 1000 messages, browser skips layout/paint for ~990 off-screen items → ~10x faster initial render.

### 6.3 Hoist Static JSX Elements (`rendering-hoist-jsx`)

```tsx
// ❌ Bad — new object on every render
function ChatInput() {
  return (
    <div>
      <svg>...</svg> {/* large static SVG, recreated each render */}
      <input />
    </div>
  );
}

// ✅ Good — hoist outside component
const SEND_ICON = <svg>...</svg>;

function ChatInput() {
  return (
    <div>
      {SEND_ICON}
      <input />
    </div>
  );
}
// Note: React Compiler (React 19) does this automatically when enabled
```

### 6.4 Optimize SVG Precision (`rendering-svg-precision`)

```bash
npx svgo --precision=1 --multipass icon.svg
```

### 6.5 Prevent Hydration Mismatch Without Flickering (`rendering-hydration-no-flicker`)
For values from localStorage/cookies, inject a sync inline script before React hydrates.

```html
<!-- In index.html, before React script -->
<script>
  try {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
</script>
```

### 6.6 Suppress Expected Hydration Mismatches (`rendering-hydration-suppress-warning`)

```tsx
// Only for intentionally different server/client values
<time suppressHydrationWarning dateTime={date.toISOString()}>
  {date.toLocaleString()} {/* locale differs server/client */}
</time>
// ⚠️ Do NOT use to hide real bugs
```

### 6.7 Use Explicit Conditional Rendering (`rendering-conditional-render`)

```tsx
// ❌ Bad — renders "0" when count is 0
{count && <Badge count={count} />}

// ✅ Good — explicit boolean
{count > 0 && <Badge count={count} />}
// or
{count ? <Badge count={count} /> : null}
```

### 6.8 Use useTransition Over Manual Loading States (`rendering-usetransition-loading`)

```typescript
// ❌ Bad — manual loading state management
const [isLoading, setIsLoading] = useState(false);
const handleSend = async () => {
  setIsLoading(true);
  try { await sendMessage(msg); } finally { setIsLoading(false); }
};

// ✅ Good — useTransition handles pending state
const [isPending, startTransition] = useTransition();
const handleSend = () => {
  startTransition(async () => {
    await sendMessage(msg);
  });
};
```

---

## Category 7: JavaScript Performance — LOW-MEDIUM

### 7.1 Avoid Layout Thrashing (`js-batch-dom-css`)
Batch style writes together; never interleave reads and writes.

```typescript
// ❌ Bad — forces reflow on each read-write cycle
el.style.width = '100px';
const height = el.offsetHeight; // forces reflow
el.style.height = height + 'px';
const width = el.offsetWidth; // forces reflow again

// ✅ Good — read all, then write all
const height = el.offsetHeight;
const width = el.offsetWidth;
el.style.width = '100px';
el.style.height = height + 'px';
```

### 7.2 Build Index Maps for Repeated Lookups (`js-index-maps`)

```typescript
// ❌ Bad — O(n²) for 1000 items × 1000 lookups
const getUser = (id: string) => users.find(u => u.id === id);

// ✅ Good — O(1) after O(n) build
const userMap = new Map(users.map(u => [u.id, u]));
const getUser = (id: string) => userMap.get(id);
```

### 7.3 Cache Storage API Calls (`js-cache-storage`)
`localStorage`/`sessionStorage` are synchronous and expensive.

```typescript
// ✅ Cache reads in module-level Map
const storageCache = new Map<string, string>();

function getStorageItem(key: string): string | null {
  if (storageCache.has(key)) return storageCache.get(key)!;
  try {
    const value = localStorage.getItem(key);
    if (value !== null) storageCache.set(key, value);
    return value;
  } catch { return null; }
}

// Invalidate on storage events
window.addEventListener('storage', (e) => {
  if (e.key) storageCache.delete(e.key);
});
```

### 7.4 Combine Multiple Array Iterations (`js-combine-iterations`)

```typescript
// ❌ Bad — two passes
const activeUsers = users.filter(u => u.active);
const adminUsers = users.filter(u => u.role === 'admin');

// ✅ Good — single pass
const activeUsers: User[] = [];
const adminUsers: User[] = [];
for (const user of users) {
  if (user.active) activeUsers.push(user);
  if (user.role === 'admin') adminUsers.push(user);
}
```

### 7.5 Early Length Check for Array Comparisons (`js-length-check-first`)

```typescript
// ✅ Check length before expensive comparison
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false; // fast exit
  return a.every((item, i) => item === b[i]);
}
```

### 7.6 Early Return from Functions (`js-early-exit`)

```typescript
// ✅ Return immediately when result is known
function processMessage(msg: Message | null): string {
  if (!msg) return '';
  if (msg.deleted) return '[deleted]';
  if (msg.type === 'system') return msg.content;
  return formatUserMessage(msg);
}
```

### 7.7 Hoist RegExp Creation (`js-hoist-regexp`)

```typescript
// ❌ Bad — new RegExp on every render/call
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // recreated each call
}

// ✅ Good — module-level constant
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email: string) {
  return EMAIL_REGEX.test(email);
}
// ⚠️ Do NOT hoist global regex (/g) — has mutable lastIndex state
```

### 7.8 Use Set/Map for O(1) Lookups (`js-set-map-lookups`)

```typescript
// ❌ Bad — O(n) array includes
const ALLOWED_ROLES = ['admin', 'moderator', 'user'];
if (ALLOWED_ROLES.includes(role)) { ... }

// ✅ Good — O(1) Set has
const ALLOWED_ROLES = new Set(['admin', 'moderator', 'user']);
if (ALLOWED_ROLES.has(role)) { ... }
```

### 7.9 Use toSorted() for Immutability (`js-tosorted-immutable`)

```typescript
// ❌ Bad — mutates array in place (breaks React immutability)
const sorted = messages.sort((a, b) => a.timestamp - b.timestamp);

// ✅ Good — returns new array
const sorted = messages.toSorted((a, b) => a.timestamp - b.timestamp);
// Also: .toReversed(), .toSpliced(), .with()
// Fallback: [...messages].sort(...)
```

---

## Category 8: Advanced Patterns — LOW

### 8.1 Initialize App Once, Not Per Mount (`advanced-init-once`)

```typescript
// ❌ Bad — re-runs on every remount (StrictMode, HMR)
useEffect(() => {
  initializeAnalytics();
  connectWebSocket();
}, []);

// ✅ Good — module-level guard
let didInit = false;

if (!didInit) {
  didInit = true;
  initializeAnalytics();
}

// Or in the entry module (main.tsx):
// initializeAnalytics(); // runs once when module loads
```

### 8.2 Store Event Handlers in Refs (`advanced-event-handler-refs`)

```typescript
// ✅ Store callback in ref to avoid effect re-subscription
function useSocketHandler(event: string, handler: (data: unknown) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler; // always up to date

  useEffect(() => {
    const listener = (data: unknown) => handlerRef.current(data);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]); // stable — handler changes don't re-subscribe
}
```

### 8.3 useEffectEvent for Stable Callback Refs (`advanced-use-latest`)
Access latest values in callbacks without adding them to dependency arrays.

```typescript
// React 19 — useEffectEvent (experimental/canary)
import { experimental_useEffectEvent as useEffectEvent } from 'react';

function useChatScroll(messages: Message[]) {
  const scrollToBottom = useEffectEvent(() => {
    // Always reads latest messages without being a dependency
    if (messages.length > 0) {
      containerRef.current?.scrollTo({ behavior: 'smooth', top: Infinity });
    }
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]); // scrollToBottom is stable
}
```

---

## References

1. https://react.dev
2. https://swr.vercel.app
3. https://tanstack.com/query
4. https://vercel.com/blog/how-we-optimized-package-imports-in-next-js
5. https://vercel.com/blog/how-we-made-the-vercel-dashboard-twice-as-fast
6. https://github.com/vercel-labs/agent-skills
