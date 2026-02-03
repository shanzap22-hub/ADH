import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js"; // Admin client import
import { KnowledgeManager } from "./_components/knowledge-manager";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function KnowledgePage() {
    const supabase = await createClient();

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    // Initialize Admin Client to bypass RLS for fetching
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch Docs using Admin Client
    const { data: docs, error } = await supabaseAdmin
        .from('ai_knowledge_docs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div>
                        <h3 className="font-bold">Database Setup Required</h3>
                        <p className="text-sm mt-1">
                            The Knowledge Base tables (ai_knowledge_docs) do not exist yet.
                            Please run the migration script (migrations/create_knowledge_base.sql) in your Supabase SQL Editor to enable this feature.
                        </p>
                        <p className="text-xs mt-2 font-mono bg-red-100 p-1 rounded">
                            Error: {error.message}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Knowledge Base</h1>
                <p className="text-gray-600 mt-1">Manage documents that the AI uses to answer questions (RAG)</p>
            </div>

            <KnowledgeManager docs={docs || []} />
        </div>
    );
}
