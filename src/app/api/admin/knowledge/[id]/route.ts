import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = await createClient();

        // Auth Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Delete Doc (Cascade deletes vectors)
        const { error } = await supabase
            .from('ai_knowledge_docs')
            .delete()
            .eq('id', params.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
