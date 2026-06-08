# Supabase connection notes

## Env values

Fill these values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Restart the dev server after changing `.env.local`.

## Client files

- `lib/supabase/browser.ts`
  - Used by client components such as popup/modal and realtime subscriptions.
- `lib/supabase/server.ts`
  - Used by server-side data fetching in App Router pages.
- `lib/data/courts.ts`
  - Reads the latest group, courts, and players from Supabase.

## Current data flow

### `/`

The home page calls `getCourtsOverviewData()` and reads:

- latest row from `groups`
- related `courts`
- related `players`

If Supabase is not configured or there is no group yet, the UI falls back to one mock court.

### `/courts/[courtId]`

The court detail page calls `getCourtDetailData(courtId)` and reads:

- selected court
- related group
- players in that group

It also subscribes to realtime changes from `players` for that group and refreshes the page when player data changes.

### Add team popup

`components/players/AddTeamsModal.tsx` inserts every typed player into:

```txt
public.players
```

Inserted fields:

- `group_id`
- `name`
- `status = waiting`
- `queue_order`

If RLS blocks the insert, the modal shows the Supabase error message.

## Required database state

Before testing add player, Supabase must have at least:

- one authenticated owner user
- one row in `profiles` for that user
- one row in `groups`
- courts auto-created by the group trigger

The group should have:

```sql
admin_id = auth.uid() of the logged-in owner
```

Otherwise RLS will allow public reading but block writing.

## Next step

The next backend step should be adding a real match-start RPC that:

1. inserts players
2. creates a match
3. creates match_players rows
4. updates court status to `playing`
5. updates players to `playing`

