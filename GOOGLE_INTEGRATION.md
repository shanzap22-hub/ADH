# How to Set Up Free Google Calendar & Meet Integration

To automatically create Google Calendar events and Google Meet links for free, we will use a **Google Apps Script**.

## Step 1: Create the Script
1. Go to [script.google.com](https://script.google.com/) and click **"New Project"**.
2. Name the project **"ADH Booking Sync"**.
3. Delete any code in `Code.gs` and paste the following code:

```javascript
function doPost(e) {
  try {
    // 1. Parse Data
    var data = JSON.parse(e.postData.contents);
    var title = data.title || "1-on-1 Mentorship Session";
    var startTime = new Date(data.startTime);
    var endTime = new Date(data.endTime);
    var studentEmail = data.studentEmail;
    var description = data.description || "Session booked via ADH LMS.";

    // 2. Create Calendar Event
    var calendar = CalendarApp.getDefaultCalendar();
    var event = calendar.createEvent(title, startTime, endTime, {
      description: description,
      guests: studentEmail,
      sendInvites: true
    });

    // 3. Add Google Meet Link
    // Note: 'addMeetConference' is not directly exposed in simple createEvent, 
    // but adding a guest usually triggers it or we can use Advanced Calendar API.
    // However, for simplicity and reliability, we will use the Advanced Service method is best, 
    // BUT 'createEvent' usually auto-adds Meet if settings allow.
    // Let's use the robust method:
    
    var eventId = event.getId();
    
    // To ensure Meet Link is created, enable "Google Calendar API" in Services on the left.
    // But often, just adding guests is enough. 
    // Let's try to get the link if it exists, or generate a fallback.
    
    // BETTER METHOD (Advanced Service - make sure to add 'Google Calendar API' service on the left sidebar + button)
    // If you don't want to add Services, standard events often autocreate links now.
    
    // Let's assume standard behavior. If not, we can manually patching.
    // For now, let's return a success.
    
    // Wait a brief moment for async Meet generation (sometimes helps)
    Utilities.sleep(1000); 
    
    // Re-fetch to see if link exists (requires Advanced API usually).
    // Instead, simply construct a link or trust the invite.
    // Actually, simple events don't guaranteed return link in object immediately without Advanced API.
    // Let's use a trick: 
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    result: "success",
    // We might not get the link back easily without Advanced API, 
    // but the User WILL get it in email. 
    // To be safe, we can return a generic Google Meet or the event ID.
    eventId: event.getId() 
  })).setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------
// REVISED ROBUST VERSION (Use this one if you add 'Google Calendar API' Service)
// ---------------------------------------------------------

function createMeeting(data) {
   // This requires adding "Google Calendar API" service in the editor sidebar!
   var eventResource = {
    summary: data.title,
    description: data.description,
    start: { dateTime: data.startTime }, // ISO String expected
    end: { dateTime: data.endTime },
    attendees: [{ email: data.studentEmail }],
    conferenceData: {
      createRequest: {
        requestId: "adh-" + new Date().getTime(),
        conferenceSolutionKey: { type: "hangoutsMeet" }
      }
    }
  };
  
  var calendarId = 'primary';
  // Use the Advanced Calendar service
  var event = Calendar.Events.insert(eventResource, calendarId, { conferenceDataVersion: 1 });
  
  return event.conferenceData.entryPoints[0].uri;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // Call the robust function
    var meetLink = createMeeting({
      title: data.title || "1-on-1 Mentorship (ADH)",
      description: "Mentorship Session regarding: " + (data.notes || "General"),
      startTime: data.startTime, // ISO String
      endTime: data.endTime,     // ISO String
      studentEmail: data.studentEmail
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      result: "success",
      meetLink: meetLink
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Step 2: Add the Calendar Service
1. In the Apps Script editor, look at the left sidebar usually under "Services" or "Libraries".
2. Click the **+** (Plus) button next to **Services**.
3. Select **Google Calendar API** and click **Add**.

## Step 3: Deploy
1. Click **Deploy** (blue button top right) > **New deployment**.
2. Select type: **Web app**.
3. Description: `v1`.
4. Execute as: **Me** (your email).
5. **Who has access: Anyone** (Important! This allows your website to call it).
6. Click **Deploy**.
7. Grant permissions when asked.
8. Copy the **Web app URL** (starts with `https://script.google.com/macros/s/...`).

## Step 4: Connect to ADH Website
1. Go to your ADH project code.
2. Open `.env.local`.
3. Add this line:
   ```
   GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_COPIED_URL_HERE/exec
   ```
4. Save the file.

Now, whenever a booking happens, it will sync to your calendar and create a Meet link!
