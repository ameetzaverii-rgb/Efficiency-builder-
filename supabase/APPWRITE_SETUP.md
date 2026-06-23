# Appwrite Setup for MEMORIQ

## 1. Create a free account
Go to https://cloud.appwrite.io → Sign up (no credit card)

## 2. Create a project
- New Project → name it "memoriq"
- Copy the **Project ID** from Settings

## 3. Add your domain to allowed platforms
Settings → Platforms → Add Platform → Web
- Name: MEMORIQ
- Hostname: localhost (for dev), then your production domain

## 4. Enable Magic URL auth
Auth → Settings → Magic URL → Enable

## 5. Create the database
Databases → Create Database
- Database ID: `memoriq` (or copy the auto-generated one)

## 6. Create the `profiles` collection
Inside the database → Create Collection → ID: `profiles`

Add these attributes:
| Attribute    | Type    | Required | Default |
|--------------|---------|----------|---------|
| user_id      | String  | Yes      | —       |
| username     | String  | No       | —       |
| total_xp     | Integer | Yes      | 0       |
| badges       | String  | No       | — (enable array) |
| challenges_completed | Integer | Yes | 0  |

Create index: Key=`user_id`, Type=Key, Attribute=user_id

Permissions → Add Role → Any → Read
Permissions → Add Role → Users → Create, Update

## 7. Create the `attempts` collection
Create Collection → ID: `attempts`

Add these attributes:
| Attribute  | Type    | Required |
|------------|---------|----------|
| user_id    | String  | Yes      |
| item_id    | String  | Yes      |
| score_pct  | Integer | Yes      |
| xp_earned  | Integer | Yes      |
| correct    | Integer | Yes      |
| total      | Integer | Yes      |
| qualified  | Boolean | Yes      |
| badges     | String  | No (array) |

Create indexes:
- Key=`item_id`, Type=Key, Attribute=item_id
- Key=`user_id`, Type=Key, Attribute=user_id

Permissions → Add Role → Any → Read
Permissions → Add Role → Users → Create

## 8. Set environment variables
Add to your `.env.local`:
```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_APPWRITE_DB_ID=<your-database-id>
```
