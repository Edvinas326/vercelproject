# Calendar Feature Setup Instructions

To set up the calendar feature in your social media website, you need to create the required database table in Supabase.

## Steps to Set Up Calendar Events Table

1. Log in to your Supabase dashboard: https://app.supabase.com/
2. Select your project (btlkhjvfgotdspjucqhh)
3. Go to the "SQL Editor" section
4. Create a new query
5. Copy and paste the entire contents of the `calendar-events-schema.sql` file
6. Click "Run" to execute the SQL script

This will:
- Create the `calendar_events` table
- Set up appropriate Row Level Security (RLS) policies
- Create necessary indexes for performance
- Add sample data for testing

## Schema Details

The `calendar_events` table includes the following columns:
- `id`: Unique identifier for each event
- `user_id`: The ID of the user who created the event
- `title`: Event title
- `description`: Event description
- `date`: Event date
- `time`: Event start time
- `end_time`: Event end time
- `location`: Event location
- `event_type`: Type of event (school, academic, holiday, etc.)
- `is_all_day`: Whether the event is an all-day event
- `is_recurring`: Whether the event is recurring
- `recurrence_pattern`: Pattern for recurring events
- `created_at`: When the event was created
- `updated_at`: When the event was last updated

## Security Policies

The following Row Level Security policies are applied:
- Users can view, create, update, and delete their own events
- Teachers can view all events

## Sample Data

The script inserts three sample events:
1. School Assembly on May 15, 2025
2. Final Exams on May 20, 2025
3. Summer Break starting on May 30, 2025

These sample events are assigned to a teacher account.

## Troubleshooting

If you encounter the error "relation public.calendar_events does not exist", it means the calendar_events table has not been created. Follow the steps above to create the table. 