# Trial Management Setup

## Automated Processes

Three scheduled automations need to be created to fully implement trial management:

### 1. Expire Trials (Daily Cron)
**Function**: `expireTrials`
**Schedule**: Daily at 00:00 UTC
**Purpose**: Mark trials as "expired" when trial_ends_at is reached

Create automation:
```
Type: Scheduled
Name: Expire Trials
Function: expireTrials
Schedule Type: Simple
Repeat Interval: 1
Repeat Unit: days
Start Time: 00:00 (UTC)
```

### 2. Trial Expiring Reminder Email (Daily Cron)
**Function**: `trialExpiringEmail`
**Schedule**: Daily at 08:00 UTC
**Purpose**: Send email reminder 3 days before trial expires

Create automation:
```
Type: Scheduled
Name: Trial Expiring Email
Function: trialExpiringEmail
Schedule Type: Simple
Repeat Interval: 1
Repeat Unit: days
Start Time: 08:00 (UTC)
```

## How Trial Activation Works

1. **On First App Visit**: When a new free user visits `/Today`, the `ensureTrialActivated` function is automatically called
   - Checks if user already has a subscription
   - If not, creates a 7-day trial with plan based on user role:
     - athlete → pro
     - coach → coach
     - nutritionist → nutritionist
     - clinician → clinician
     - admin → pro

2. **Trial Display**: The `TrialBanner` component displays:
   - Days remaining
   - "Assinar agora" (Upgrade now) button (blue or red if urgent ≤2 days)
   - Dismiss button

3. **Trial Expiration Flow**:
   - Day 3 before expiry: Email reminder sent
   - On expiry: Status changed to "expired"
   - User sees "trial expired" in UpgradeGate when accessing premium features

## Files Modified/Created

- `functions/ensureTrialActivated` - Auto-activate trial on first /Today visit
- `functions/expireTrials` - Daily cron to mark expired trials
- `functions/trialExpiringEmail` - Daily cron to send reminders
- `pages/Today.js` - Added useEffect to trigger ensureTrialActivated
- `components/shared/TrialBanner.js` - Displays trial status with upgrade CTA
- `lib/SubscriptionContext.jsx` - Provides trialDaysRemaining and isTrialExpired
- `components/entitlements/UpgradeGate.js` - Shows "trial expired" message

## Testing

1. Create a test user and check `/Today` page
2. Verify trial Subscription record created with status="trialing"
3. Check TrialBanner displays days remaining
4. Manually call `expireTrials` to test expiration (or wait until trial_ends_at)
5. Verify "trial expired" message shows in premium features (UpgradeGate)