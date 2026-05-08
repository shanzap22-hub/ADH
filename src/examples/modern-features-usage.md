# Usage Examples - Modern Features

## 1. Firebase Crashlytics

### Initialize on App Launch
    ```tsx
// src/app/layout.tsx or app entry point
import { crashlytics, setupGlobalErrorHandler } from '@/lib/crashlytics';

useEffect(() => {
  // Initialize crashlytics with user
  crashlytics.initialize(user?.id, user?.email);
  
  // Setup global error handlers
  setupGlobalErrorHandler();
}, [user]);
```

### Log Errors
    ```tsx
try {
  await someAsyncOperation();
} catch (error) {
  // Log to Crashlytics with context
  await crashlytics.logError(error as Error, {
    operation: 'course_purchase',
    courseId: course.id,
    userId: user.id,
  });
  
  // Show error to user
  toast.error('Purchase failed');
}
```

### Custom Logging
    ```tsx
// Log important events
await crashlytics.log('User completed onboarding');

// Set custom keys for debugging
await crashlytics.setCustomKey('subscription_tier', user.tier);
await crashlytics.setCustomKey('courses_enrolled', enrolledCourses.length);
```

---

## 2. Share Functionality

### Share Course
    ```tsx
import { useShare } from '@/lib/share';

function CourseCard({ course }) {
  const { shareCourse } = useShare();

  return (
    <Button 
      onClick={() => shareCourse({
        id: course.id,
        title: course.title,
        description: course.description,
      })}
      variant="outline"
    >
      <Share2 className="w-4 h-4 mr-2" />
      Share Course
    </Button>
  );
}
```

### Share Achievement
    ```tsx
import { shareService } from '@/lib/share';

async function handleCourseCompletion() {
  await shareService.shareAchievement(
    `completed the course "${course.title}"`
  );
}
```

### Conditional Rendering
    ```tsx
const { canShare } = useShare();
const [isShareAvailable, setIsShareAvailable] = useState(false);

useEffect(() => {
  canShare().then(setIsShareAvailable);
}, []);

if (isShareAvailable) {
  return <ShareButton />;
}
```

---

## 3. Haptic Feedback

### Button Clicks
    ```tsx
import { haptics } from '@/lib/haptics';

<Button 
  onClick={() => {
    haptics.light();  // Tactile feedback
    handleClick();
  }}
>
  Click Me
</Button>
```

### Form Submission
    ```tsx
async function handleSubmit(e) {
  e.preventDefault();
  
  if (!isValid) {
    await haptics.warning();  // Vibrate on validation error
    return;
  }
  
  await haptics.medium();  // Confirm submission
  await submitForm();
  await haptics.success();  // Success feedback
}
```

### Common Patterns
    ```tsx
import { hapticPatterns } from '@/lib/haptics';

// Quick shortcuts
<Button onClick={hapticPatterns.buttonClick}>Normal</Button>
<Button onClick={hapticPatterns.formSubmit}>Submit</Button>
<Button onClick={hapticPatterns.delete}>Delete</Button>
```

### Long Press
    ```tsx
const handleLongPress = () => {
  haptics.heavy();
  showContextMenu();
};

<div onContextMenu={handleLongPress}>
  Right-click or long press
</div>
```

---

## 4. Combined Example

    ```tsx
'use client';

import { useState } from 'react';
import { useShare } from '@/lib/share';
import { haptics } from '@/lib/haptics';
import { crashlytics } from '@/lib/crashlytics';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

export function EnhancedCourseCard({ course }) {
  const { shareCourse } = useShare();
  const [isSharing, setIsSharing] = useState(false);

  async function handleShare() {
    try {
      setIsSharing(true);
      await haptics.light();  // Tactile feedback
      
      await shareCourse({
        id: course.id,
        title: course.title,
        description: course.description,
      });
      
      await haptics.success();  // Success feedback
      await crashlytics.log(`Shared course: ${ course.id } `);
    } catch (error) {
      await haptics.error();  // Error feedback
      await crashlytics.logError(error as Error, {
        action: 'share_course',
        courseId: course.id,
      });
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="course-card">
      <h3>{course.title}</h3>
      <Button 
        onClick={handleShare}
        disabled={isSharing}
        variant="outline"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>
    </div>
  );
}
```

---

## Build Variants

### Build Staging APK
    ```bash
cd android
./gradlew assembleStagingDebug
```

### Build Production APK
    ```bash
./gradlew assembleProductionRelease
```

### Build AAB(for Play Store)
    ```bash
# Staging AAB
./gradlew bundleStagingRelease

# Production AAB
./gradlew bundleProductionRelease
```

### Different App Icons per Variant
Create separate icons:
- `android/app/src/staging/res/mipmap-*/ic_launcher.png`
    - `android/app/src/production/res/mipmap-*/ic_launcher.png`

---

## Testing Checklist

    - [] Crashlytics logs appear in Firebase Console
        - [] Share dialog opens with course info
            - [] Haptics work on button clicks
                - [] Staging and production builds work
                    - [] Different app icons appear for variants
                        - [] Error tracking works in production
