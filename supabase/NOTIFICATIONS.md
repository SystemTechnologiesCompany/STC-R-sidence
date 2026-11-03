# Push notifications setup

The app registers an Expo push token after Google sign-in. Student profiles, reports, conversations, and staff approvals now use Supabase; the database event function routes the matching alerts.

## 1. Update Supabase

In the Supabase Dashboard, open **SQL Editor** and run these in order:

1. `schema.sql` (only if the base schema has not already been applied)
2. `migrations/20261102010000_push_notifications.sql`
3. `migrations/20261102020000_account_sync_and_ratings.sql`

The latest migration adds server-backed residence ratings, admin-reply timing, secure report completion, and manager announcements with checked recipients. The app restores the signed-in user's profile, role, and residence from Supabase whenever the session is reopened.

The first residence manager must be designated once by the project owner. Sign in to the app with that Google account as a student, choose Khelafoui, and continue until the profile is created. Then run this in SQL Editor, replacing the email with the manager's Google email:

```sql
update public.profiles p
set role = 'manager', role_status = 'active', service = null
from auth.users u
where p.id = u.id
  and u.email = 'manager@example.com'
  and p.residence_id = (select id from public.residences where name = 'Khelafoui El-Hadj');
```

After that, the manager account can approve pending service staff from **Équipe de résidence** in the app. Staff accounts only receive reports for their approved service.

## 2. Deploy the notification function

From the project folder in PowerShell:

```powershell
npx supabase@latest login
npx supabase@latest link --project-ref ikesrtvfmowjrxhhvtjo
npx supabase@latest functions deploy send-push-notification
```

The function uses the Supabase service key supplied by Supabase at runtime. Keep service keys out of `.env` values with the `EXPO_PUBLIC_` prefix and out of the app.

## 3. Connect the database events

In **Database → Webhooks**, create these three webhooks. For each, choose **Supabase Edge Functions**, select `send-push-notification`, method `POST`, and add the **secret key** as the `apikey` HTTP header.

| Webhook | Table | Event |
| --- | --- | --- |
| `push-report-created` | `reports` | Insert |
| `push-report-reply` | `report_messages` | Insert |
| `push-major-release` | `app_releases` | Insert |
| `push-residence-announcement` | `residence_announcements` | Insert |

The function filters `app_releases` to rows where `is_major` is true. Report alerts go to active service staff and active managers in that residence. A staff or manager reply goes to the student and the residence manager. Major releases go to every registered device. Announcements go only to the selected users, or to everyone in the manager's residence when no users are selected.

## 4. Set up Android push credentials and build

Expo remote push notifications need Firebase Cloud Messaging credentials in EAS and a `google-services.json` file configured in `app.json`. Follow Expo's [Android FCM setup](https://docs.expo.dev/push-notifications/fcm-credentials/) for the Firebase project. Add the downloaded `google-services.json` to this project root and set `android.googleServicesFile` to `./google-services.json` in `app.json`.

Then build a new **preview** APK, install it, and sign in. Android remote push notifications do not work in Expo Go; use the installed EAS build. See Expo's [push setup guide](https://docs.expo.dev/push-notifications/push-notifications-setup/).

## 5. Publish a major release notification

After the APK is available from GitHub Releases, an active manager can insert its details into `app_releases` (the manager publishing screen can be connected later):

```sql
insert into public.app_releases (version, title, notes, download_url, created_by)
values (
  '1.1.0',
  'Nouvelle version de STC Résidence',
  'Décrivez ici les changements importants.',
  'https://github.com/OWNER/REPOSITORY/releases/download/v1.1.0/app-release.apk',
  'MANAGER_PROFILE_UUID'
);
```

The insert sends the major-update notification to all registered devices. Do not use a GitHub source-code link; `download_url` must point to the APK asset. The update notification opens the app's profile area.

The report form and conversations now write to Supabase. The migration enables realtime updates for reports and messages, and the webhooks send the push alerts after database inserts.
