# Next.js Server / Client Pattern

> **Reference doc.** Follow this pattern for every new page and component in `frontend/`.

**Versions (from `frontend/package.json`):** `next` 16.4.2 · `react` / `react-dom` 19.3.0

**Enabled in `frontend/next.config.ts`:** `cacheComponents: true`, `partialPrefetching: true`

**Canonical example:** [`frontend/app/properties/test/`](../../frontend/app/properties/test/)

This is Next.js 16. If you are an AI agent, read the matching guide in `frontend/node_modules/next/dist/docs/` before writing code (see [`frontend/AGENTS.md`](../../frontend/AGENTS.md)). Patterns from Next 13–15 (`middleware.ts`, synchronous `params`, `cookies()` without `connection()`) are wrong here.

---

## The rule

1. **Pages and layouts are Server Components.** Never put `"use client"` in `page.tsx` or `layout.tsx`.
2. **Fetch data on the server** and pass it down as props.
3. **Push `"use client"` down to the smallest leaf** that needs interactivity.
4. **Client component files are named `*.client.tsx`**, and their **first line** is `"use client";`.

```
app/properties/test/
├── page.tsx                    ← Server Component: auth check + data fetch
└── PropertySelect.client.tsx   ← Client Component: renders + handles onChange
```

### `page.tsx` (server)

```tsx
// Reference pattern: fetch in a Server Component with the server Supabase client,
// then pass the data to a small client component only for interactivity.
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import PropertySelect from "./PropertySelect.client";

export default async function PropertiesTestPage() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return <p><Link href="/properties">Sign in to view properties</Link></p>;
  }

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, name")
    .order("name");
  if (error) throw error;

  return <PropertySelect properties={properties ?? []} />;
}
```

### `PropertySelect.client.tsx` (client)

```tsx
"use client";

export type Property = { id: string; name: string };

export default function PropertySelect({ properties }: { properties: Property[] }) {
  return (
    <select name="property_id" defaultValue="" onChange={(e) => console.log(e.target.value)}>
      <option value="" disabled>Choose a property</option>
      {properties.map((property) => (
        <option key={property.id} value={property.id}>
          {property.name}
        </option>
      ))}
    </select>
  );
}
```

Why this shape works:

- The data is in the HTML on first paint. There is no loading spinner, no `useEffect` fetch and no request waterfall.
- Only `PropertySelect` ships JavaScript. The page's code stays on the server.
- Auth runs on the server, before any data is sent to the browser.

---

## Naming and directive conventions

| Rule | Example |
|---|---|
| Client component file ends in `.client.tsx` | `PropertySelect.client.tsx`, `upload.client.tsx` |
| `"use client";` is the **first line**, above the imports | see above |
| Import it without the `.tsx` extension | `import PropertySelect from "./PropertySelect.client";` |
| Server files get no suffix and no directive | `page.tsx`, `layout.tsx`, `PropertyList.tsx` |
| Server Actions go in a file whose first line is `"use server";` | `actions.ts` (next to the page that uses them) |

`"use client"` marks a **boundary**: everything the file imports also goes into the client bundle. So keep `.client.tsx` files small, and don't import server-only modules (`@/utils/supabase/server`, `next/headers`, secrets) into them.

---

## What MUST be a Client Component

If a component uses any of the following, it must be in a `.client.tsx` file.

**React hooks that rely on state, effects or context**

- `useState`, `useReducer`
- `useEffect`, `useLayoutEffect`, `useInsertionEffect`
- `useRef` (for DOM refs or mutable values)
- `useContext` and context providers (`createContext`)
- `useTransition`, `useDeferredValue`, `useOptimistic`
- `useActionState`, `useFormStatus` (form pending and error UI)
- `useSyncExternalStore`
- Any custom hook that uses one of these

**Next.js client hooks** (`next/navigation`)

- `useRouter`, `usePathname`, `useSearchParams`, `useParams`
- `useSelectedLayoutSegment(s)`, `useLinkStatus`

**Event handlers**

- `onClick`, `onChange`, `onSubmit`, `onBlur`, `onKeyDown`, etc. Functions can't be passed from server to client as props. The one exception is Server Actions.

**Browser-only APIs**

- `window`, `document`, `localStorage` / `sessionStorage`, `navigator`
- `window.confirm` / `alert`, `FileReader`, `URL.createObjectURL`, clipboard, geolocation
- `IntersectionObserver`, `ResizeObserver`, `matchMedia`

**Interactive third-party UI**

- CoreUI components that keep internal state or take callbacks (modals, dropdowns, toasts, `CForm` with `validated`). Static CoreUI markup such as `CCard` and `CCardHeader` works in Server Components; see `app/invoices/upload/page.tsx`.

**Supabase work that must happen in the browser**

- `supabase.auth.onAuthStateChange(...)`: listens for sign-in/sign-out in the browser
- Realtime channels (`supabase.channel(...).subscribe()`)
- Anything that has to react instantly to browser auth state without a server round-trip

If a component only receives data and renders markup, it is **not** a client component, even if it is reused. Leave the suffix and directive off.

---

## Mutations: what runs where

A mutation is triggered on the client (a click or a form submit), but **the write runs on the server by default**.

| Mutation | Where the write runs | How |
|---|---|---|
| Create / update / delete rows | **Server Action** (`"use server"`) using the server Supabase client | `<form action={createProperty}>` or call it from a handler |
| Pending / error / optimistic UI around a write | **Client** (`useActionState`, `useFormStatus`, `useOptimistic`) | Inside a `.client.tsx` form |
| Confirm dialogs ("Delete X?") | **Client** (`window.confirm` or a CoreUI modal) | Show the dialog, then call the Server Action |
| File selection / preview / reading a file in the browser | **Client** | `<input type="file">` + `FileReader` in a `.client.tsx` |
| PDF extraction | **Route Handler** (`app/api/invoices/extract/route.ts`), called from the client with `fetch` | Existing invoice upload flow |
| Auth listener, realtime subscriptions | **Client only** (browser Supabase client) | See [Supabase data fetching](./supabase-data-fetching.md) |
| Sign in / sign out | Either side works with `@supabase/ssr`, because both write the session cookie. The current pages use the browser client. | — |

### Server Action template

```ts
// app/properties/actions.ts
"use server";

import { refresh } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function createProperty(formData: FormData) {
  const supabase = await createClient();

  // Server Actions are public POST endpoints. Always check auth.
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Unauthorized");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter a property name." };

  const { error } = await supabase.from("properties").insert({ name });
  if (error) return { error: error.message };

  refresh(); // re-render the current route so the server fetch picks up the new row
}
```

- Use `refresh()` (from `next/cache`) when the page's data is uncached, which is our default because every Supabase server read goes through `connection()`.
- Use `revalidatePath` / `updateTag` only for data that is wrapped in `"use cache"`.
- `refresh()` can **only** be called inside a Server Action.

---

## Data fetching

### Default: prefetch on the server, render on the client

```
page.tsx (server)  ──fetch──▶  Supabase
      │
      └── props ──▶  Thing.client.tsx  (state, handlers)
```

1. `await` the data in `page.tsx` (or in a server component the page renders).
2. Pass **plain, serializable** data as props: strings, numbers, booleans, plain objects and arrays, `Date`. You can also pass Server Actions.
3. Don't pass class instances, functions (other than Server Actions) or the Supabase client.

### Streaming slow data

With `cacheComponents`, reading cookies (which every server Supabase call does) is **request-time data**. It must render inside a `<Suspense>` boundary. Pages are covered by the root [`app/loading.tsx`](../../frontend/app/loading.tsx). If you read request-time data inside a **layout**, or want part of a page to show before the data arrives, add your own boundary:

```tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <>
      <h1>Properties</h1>
      <Suspense fallback={<p className="text-body-secondary">Loading…</p>}>
        <PropertyList /> {/* async server component that fetches */}
      </Suspense>
    </>
  );
}
```

You can also start the fetch on the server **without awaiting it**, pass the promise to a client component, and unwrap it there with React's `use(promise)` inside `<Suspense>`. Use this when the client component needs the data but the shell should render first.

### When client-side fetching is OK

Fetch from a client component only when the data **can't be known at render time**:

- It depends on user input after load (typeahead search, filters you don't want in the URL)
- It comes from a browser-only source (realtime, a file the user just picked)
- It polls

Even then, prefer putting filters in `searchParams` so the server can fetch. When you do fetch on the client, cancel stale responses (see the `active` flag pattern in the Supabase doc).

### Comparison: a client-rendered page

[`app/properties/page.tsx`](../../frontend/app/properties/page.tsx) takes a client-first approach: the whole page is `"use client"`, and it checks auth and loads data in `useEffect`. That works well. The tradeoff is that the whole page ships as JavaScript and shows a loading state before the data appears. For new pages, start from the server-first pattern above. The properties page can move to it when that's convenient.

---

## Checklist for a new page

- [ ] `page.tsx` has no `"use client"`
- [ ] Auth is checked on the server with `getClaims()` before any data is read
- [ ] Data is fetched on the server with `@/utils/supabase/server`
- [ ] Interactive parts are in `*.client.tsx` files that start with `"use client";`
- [ ] Props passed to client components are serializable
- [ ] Writes go through a `"use server"` action that checks auth and calls `refresh()`
- [ ] Request-time data is inside `<Suspense>` (or covered by `loading.tsx`)
- [ ] `npm run lint` passes
