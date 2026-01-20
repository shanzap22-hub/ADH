import { createAdminClient } from "@/lib/supabase/admin";

type AuditAction =
    | "CREATE_TRANSACTION"
    | "UPDATE_TRANSACTION"
    | "REFUND_TRANSACTION"
    | "UPDATE_PROFILE_TIER"
    | "UPDATE_COURSE_TIER_PRICE"
    | "UPDATE_TIER_FEATURES"
    | "MANUAL_ENROLLMENT"
    | "OTHER";

export async function logAudit({
    action,
    entityType,
    entityId,
    details,
    userId
}: {
    action: string; // Allowing string for flexibility, but prefer AuditAction types
    entityType: string;
    entityId?: string;
    details?: any;
    userId: string;
}) {
    try {
        const supabase = createAdminClient();
        await supabase.from('audit_logs').insert({
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            details
        });
        console.log(`[AUDIT] ${action} logged for user ${userId}`);
    } catch (error) {
        console.error("Failed to write audit log:", error);
        // Don't throw error to avoid breaking main flow
    }
}
