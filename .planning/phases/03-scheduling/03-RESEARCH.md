# Phase 3: Scheduling - Research

**Researched:** 2026-02-03
**Domain:** Date/Time Picking, Timezone Handling, Scheduling UI
**Confidence:** HIGH

## Summary

This phase implements the ability to schedule approved drafts for future publication. The research investigated three core domains: (1) date/time picker components for React/shadcn/ui, (2) timezone handling best practices, and (3) Convex scheduled functions for backend timing.

The project already has the backend infrastructure in place: the `drafts` schema includes a `scheduledFor` field (timestamp), a `scheduled` status, and an index `by_scheduled`. A `schedule` mutation exists that validates the draft is approved before scheduling. The main work is UI: building a date/time picker that displays in the user's local timezone and converts to UTC for storage.

**Primary recommendation:** Use the shadcn/ui Calendar + Popover components with a custom time input, leveraging the browser's `Intl.DateTimeFormat` API for timezone display. Store all times as UTC epoch milliseconds (which Convex already expects). Use date-fns for date manipulation and formatting.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-day-picker | 9.x | Calendar UI | shadcn/ui Calendar is built on this |
| date-fns | 4.x | Date manipulation/formatting | Industry standard, tree-shakeable |
| Intl.DateTimeFormat | native | Timezone display | Browser API, zero-bundle-size |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @date-fns/tz | 1.x | Timezone conversion | Only if explicit timezone selection needed |
| shadcn Calendar | - | Calendar component | Date selection UI |
| shadcn Popover | - | Dropdown container | Wrapping calendar |
| shadcn Select | - | Time dropdowns | Hour/minute selection |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| date-fns | Temporal API | Temporal is bleeding-edge, not fully supported |
| Custom time input | chrono-node | Natural language adds complexity, overkill for scheduling |
| Simple dropdowns | react-time-picker | Extra dependency, less customizable |

**Installation:**
```bash
# shadcn components (if not installed)
pnpm dlx shadcn@latest add calendar popover select

# date-fns for date manipulation
bun add date-fns
```

## Architecture Patterns

### Recommended Component Structure
```
src/components/
├── ui/
│   ├── calendar.tsx          # shadcn Calendar (already exists or add)
│   ├── popover.tsx           # shadcn Popover (already exists)
│   ├── select.tsx            # shadcn Select (already exists)
│   └── datetime-picker.tsx   # New: combines calendar + time
└── ScheduleDialog.tsx        # New: schedule modal for approved drafts
```

### Pattern 1: UTC Storage, Local Display
**What:** Store all timestamps as UTC epoch milliseconds in Convex. Display in user's local timezone.
**When to use:** Always - this is the only correct approach for scheduling.
**Example:**
```typescript
// Source: JavaScript Intl.DateTimeFormat API
// Storage: UTC epoch milliseconds
const scheduledFor = Date.now() + 3600000; // 1 hour from now

// Display: User's local timezone
function formatScheduledTime(timestamp: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(timestamp));
}

// Get user's timezone for display
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// e.g., "America/Sao_Paulo"
```

### Pattern 2: DateTimePicker Component
**What:** Combine shadcn Calendar with time selection (hour/minute dropdowns).
**When to use:** For scheduling interface.
**Example:**
```typescript
// Source: shadcn/ui patterns + date-fns
import { format, setHours, setMinutes } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
}

function DateTimePicker({ value, onChange, minDate }: DateTimePickerProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45]; // 15-minute intervals

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return onChange(undefined);
    // Preserve time when changing date
    const newDate = value
      ? setHours(setMinutes(date, value.getMinutes()), value.getHours())
      : setHours(date, 9); // Default to 9 AM
    onChange(newDate);
  };

  const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
    if (!value) return;
    const numVal = parseInt(val, 10);
    const newDate = type === 'hour'
      ? setHours(value, numVal)
      : setMinutes(value, numVal);
    onChange(newDate);
  };

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, 'PPP') : 'Selecionar data'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={(date) => minDate ? date < minDate : date < new Date()}
          />
        </PopoverContent>
      </Popover>

      <Select
        value={value?.getHours().toString()}
        onValueChange={(v) => handleTimeChange('hour', v)}
        disabled={!value}
      >
        <SelectTrigger className="w-[80px]">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={h.toString()}>
              {h.toString().padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value?.getMinutes().toString()}
        onValueChange={(v) => handleTimeChange('minute', v)}
        disabled={!value}
      >
        <SelectTrigger className="w-[80px]">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((m) => (
            <SelectItem key={m} value={m.toString()}>
              {m.toString().padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

### Pattern 3: Schedule Mutation Integration
**What:** Call the existing `schedule` mutation with UTC timestamp.
**When to use:** When user confirms scheduling.
**Example:**
```typescript
// Source: Existing convex/drafts.ts pattern
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '../../convex/_generated/api';

// In component:
const { mutate: scheduleDraft, isPending } = useMutation({
  mutationFn: useConvexMutation(api.drafts.schedule),
  onSuccess: () => {
    toast.success('Draft agendado!');
    onClose();
  },
  onError: (error) => toast.error(`Erro: ${error.message}`),
});

// When user confirms:
const handleSchedule = () => {
  if (!selectedDate || !draft) return;
  scheduleDraft({
    id: draft._id,
    scheduledFor: selectedDate.getTime(), // UTC epoch milliseconds
  });
};
```

### Anti-Patterns to Avoid
- **Storing local timestamps:** Never store local time - always UTC epoch milliseconds
- **Using moment.js:** Deprecated, use date-fns instead
- **Manual timezone math:** Use Intl.DateTimeFormat, not manual offset calculations
- **Validating past times client-side only:** Backend already validates, but show user-friendly errors

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | String concatenation | `Intl.DateTimeFormat` or `date-fns format()` | Locale issues, edge cases |
| Timezone display | Manual UTC offset | `Intl.DateTimeFormat().resolvedOptions().timeZone` | DST handling |
| Calendar UI | Custom calendar grid | shadcn Calendar (react-day-picker) | A11y, keyboard nav, edge cases |
| Time validation | Regex on time strings | date-fns `isValid()`, `isFuture()` | Edge cases, DST transitions |

**Key insight:** Date/time handling has countless edge cases (DST, leap seconds, locale formats). The browser's Intl API and date-fns handle these; custom solutions will have bugs.

## Common Pitfalls

### Pitfall 1: Storing Local Time Instead of UTC
**What goes wrong:** Scheduled posts publish at wrong time for users in different timezones
**Why it happens:** Using `new Date().toISOString()` without understanding it's already UTC
**How to avoid:** Always use `Date.now()` or `date.getTime()` for storage (both return UTC epoch ms)
**Warning signs:** Tests pass locally but fail in CI (different timezone)

### Pitfall 2: Displaying UTC to User
**What goes wrong:** User sees "10:00" but meant their local 10:00, not UTC 10:00
**Why it happens:** Directly displaying stored timestamp without timezone conversion
**How to avoid:** Always use `Intl.DateTimeFormat` with explicit timeZone option
**Warning signs:** Users complain times are "off by a few hours"

### Pitfall 3: Past Time Validation Race Condition
**What goes wrong:** User selects 10:01, by the time they click submit it's 10:02
**Why it happens:** Only validating on selection, not on submit
**How to avoid:** Validate at submit time, add small buffer (e.g., 5 minutes minimum)
**Warning signs:** "Draft must be scheduled in the future" errors

### Pitfall 4: Calendar Blocking Current Day
**What goes wrong:** User can't schedule for later today
**Why it happens:** Using `date < new Date()` instead of comparing date-only
**How to avoid:** Compare only dates for calendar, validate time separately
**Warning signs:** Users report they "can't schedule for today"

### Pitfall 5: Time Dropdown Without Date
**What goes wrong:** User picks time but forgets date, submits invalid data
**Why it happens:** Time controls enabled before date selected
**How to avoid:** Disable time controls until date is selected
**Warning signs:** Crashes or weird behavior when time selected without date

## Code Examples

Verified patterns from official sources:

### Minimum Future Date Validation
```typescript
// Source: date-fns docs
import { addMinutes, isBefore } from 'date-fns';

function validateScheduleTime(scheduledFor: Date): string | null {
  const minimumTime = addMinutes(new Date(), 5); // 5 minute buffer
  if (isBefore(scheduledFor, minimumTime)) {
    return 'Agende para pelo menos 5 minutos no futuro';
  }
  return null;
}
```

### Display Timezone Indicator
```typescript
// Source: MDN Intl.DateTimeFormat
function getTimezoneDisplay(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = new Date().toLocaleTimeString('en-US', {
    timeZoneName: 'shortOffset',
    timeZone: tz,
  }).split(' ').pop(); // e.g., "GMT-3"
  return `${tz} (${offset})`;
}
// Returns: "America/Sao_Paulo (GMT-3)"
```

### Scheduled Drafts Query with Sort
```typescript
// Source: Existing convex/drafts.ts patterns
// Note: This may already exist or need adding
export const listScheduled = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('drafts')
      .withIndex('by_status', (q) => q.eq('status', 'scheduled'))
      .order('asc') // Nearest scheduled first
      .take(50);
  },
});
```

### Schedule Dialog Integration
```typescript
// Source: Existing DraftDetailSheet patterns
interface ScheduleDialogProps {
  draft: Draft;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ScheduleDialog({ draft, open, onOpenChange }: ScheduleDialogProps) {
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [error, setError] = useState<string | null>(null);

  const { mutate: scheduleDraft, isPending } = useMutation({
    mutationFn: useConvexMutation(api.drafts.schedule),
    onSuccess: () => {
      toast.success('Draft agendado!');
      onOpenChange(false);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const handleSchedule = () => {
    if (!scheduledDate) return;
    const validationError = validateScheduleTime(scheduledDate);
    if (validationError) {
      setError(validationError);
      return;
    }
    scheduleDraft({
      id: draft._id,
      scheduledFor: scheduledDate.getTime(),
    });
  };

  // ... dialog UI
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| moment.js | date-fns | 2020+ | Smaller bundle, immutable |
| moment-timezone | @date-fns/tz or Intl API | 2024+ | Tree-shakeable, native |
| react-day-picker v8 | react-day-picker v9 | 2024 | date-fns optional, new API |
| Manual timezone math | Intl.DateTimeFormat | Always | Browser handles DST |

**Deprecated/outdated:**
- moment.js: No longer maintained for new features, use date-fns
- react-day-picker v8: v9 has breaking API changes, use v9 patterns

## Open Questions

Things that couldn't be fully resolved:

1. **Minimum schedule buffer time**
   - What we know: Need some buffer to avoid race conditions
   - What's unclear: Business requirement - 5 min? 15 min? 1 hour?
   - Recommendation: Default to 5 minutes, make configurable

2. **Schedule editing vs. rescheduling**
   - What we know: Users may want to change scheduled time
   - What's unclear: Should this be same UI or separate flow?
   - Recommendation: Same UI - "Schedule" button when approved OR scheduled

3. **Cancel scheduled draft**
   - What we know: Users should be able to cancel schedules
   - What's unclear: Does it go back to "approved" or needs review again?
   - Recommendation: Return to "approved" status (no re-review needed)

## Sources

### Primary (HIGH confidence)
- [shadcn/ui Date Picker](https://ui.shadcn.com/docs/components/date-picker) - Component patterns
- [shadcn/ui Calendar](https://ui.shadcn.com/docs/components/calendar) - Installation, usage
- [MDN Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) - Timezone API
- [date-fns v4 Timezone Support](https://blog.date-fns.org/v40-with-time-zone-support/) - TZDate API
- [Convex Scheduled Functions](https://docs.convex.dev/scheduling/scheduled-functions) - Backend scheduling

### Secondary (MEDIUM confidence)
- [shadcnui-expansions DateTime Picker](https://shadcnui-expansions.typeart.cc/docs/datetime-picker) - Community pattern
- [shadcn-date-time-picker](https://time.rdsx.dev/) - Alternative implementation
- [react-day-picker v9 upgrade](https://daypicker.dev/upgrading) - API changes

### Tertiary (LOW confidence)
- WebSearch results on timezone best practices - Verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - shadcn/ui + date-fns is well-documented standard
- Architecture: HIGH - Follows existing project patterns (DraftDetailSheet, mutations)
- Pitfalls: MEDIUM - Based on common knowledge, some items need validation

**Research date:** 2026-02-03
**Valid until:** 60 days (mature, stable libraries)
