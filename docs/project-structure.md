# Project Structure

โปรเจกต์นี้แยกบทบาทเป็น 2 ชั้น:

1. Frontend: Next.js App Router, pages, UI components
2. Backend: Supabase schema, RLS, SQL functions, Realtime setup

## Frontend

```txt
app/
├─ admin/
│  ├─ page.tsx
│  └─ courts/[courtId]/page.tsx
├─ join/[groupCode]/page.tsx
├─ queue/[groupCode]/page.tsx
├─ courts/[courtId]/page.tsx
└─ page.tsx

components/
├─ admin/
│  ├─ courts/
│  ├─ layout/
│  └─ players/
├─ user/
└─ shared/
```

### Admin

ใช้สำหรับคนจัดก๊วนและคุมสนาม:

- `/admin`
- `/admin/courts/[courtId]`

โค้ด UI อยู่ใน:

```txt
components/admin/
lib/admin/
```

### User

ใช้สำหรับผู้เล่นทั่วไปในอนาคต:

- `/join/[groupCode]`
- `/queue/[groupCode]`

โค้ด UI อยู่ใน:

```txt
components/user/
lib/user/
```

## Backend

Supabase SQL อยู่ใน:

```txt
backend/supabase/migrations/
```

ไฟล์ในนี้คือ source of truth สำหรับ database/backend logic เช่น:

- table changes
- indexes
- RLS policies
- RPC functions
- Realtime publication setup

## Compatibility Routes

เพื่อไม่ให้ลิงก์เก่าพัง:

- `/` redirect ไป `/admin`
- `/courts/[courtId]` redirect ไป `/admin/courts/[courtId]`
