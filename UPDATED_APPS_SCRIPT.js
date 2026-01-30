// ----------------------------------------------------------------------------
// UPDATED GOOGLE APPS SCRIPT CODE
// ----------------------------------------------------------------------------
// This script now handles UPDATES (Upsert) to avoid duplicate rows.
// When 'verify' is called a second time (after profile complete), it UPDATES the existing row.

function doPost(e) {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        var doc = SpreadsheetApp.getActiveSpreadsheet();
        var rawData = JSON.parse(e.postData.contents);

        var action = rawData.action || 'initiate';
        var orderId = rawData.order_id || rawData.razorpay_order_id;

        // Sheet Definitions
        var ordersSheet = doc.getSheetByName("Orders");
        var dropOffsSheet = doc.getSheetByName("Drop-offs");

        if (action === 'initiate') {
            // 1. Add to Drop-offs (Always Append new drop-offs)
            // Check for duplicates first to be clean? (Optional, skipping for speed)
            dropOffsSheet.appendRow([
                orderId,
                rawData.email || "Guest",
                rawData.name || "Guest",
                rawData.phone || "",
                rawData.whatsapp || "",
                rawData.plan || "",
                rawData.amount || "",
                "initiated",
                "PENDING",
                new Date()
            ]);

            return ContentService.createTextOutput(JSON.stringify({ "result": "success", "msg": "Added to Drop-offs" })).setMimeType(ContentService.MimeType.JSON);

        } else if (action === 'verify') {
            // 2. Add or Update Orders Sheet

            // SEARCH for existing Order ID
            var data = ordersSheet.getDataRange().getValues();
            var foundIndex = -1;

            // Assume Order ID is in Column 1 (Index 0)
            for (var i = 1; i < data.length; i++) { // Start from 1 to skip Header
                if (data[i][0] == orderId) {
                    foundIndex = i;
                    break;
                }
            }

            var rowData = [
                orderId,
                rawData.email,
                rawData.name,
                rawData.phone,
                rawData.whatsapp,
                rawData.plan,
                rawData.amount,
                "verified",
                rawData.payment_id,
                new Date()
            ];

            if (foundIndex > -1) {
                // UPDATE existing row (1-based index)
                var range = ordersSheet.getRange(foundIndex + 1, 1, 1, rowData.length);
                range.setValues([rowData]); // Update values
                var msg = "Updated existing Order";
            } else {
                // APPEND new row
                ordersSheet.appendRow(rowData);
                var msg = "Added new Order";
            }

            // 3. CLEANUP: Delete from Drop-offs
            deleteFromSheet(dropOffsSheet, orderId);

            return ContentService.createTextOutput(JSON.stringify({ "result": "success", "msg": msg })).setMimeType(ContentService.MimeType.JSON);
        }

    } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": e.toString() })).setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}

// Helper: Delete row by Order ID
function deleteFromSheet(sheet, idToDelete) {
    var data = sheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 0; i--) { // Loop backwards
        if (data[i][0] == idToDelete) {
            sheet.deleteRow(i + 1);
        }
    }
}
