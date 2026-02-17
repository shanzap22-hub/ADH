import { getMindMaps } from '@/actions/mind-map';
import CreateMindMapButton from '@/components/mind-map/CreateMindMapButton';
import DeleteMindMapButton from '@/components/mind-map/DeleteMindMapButton';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default async function MindMapsPage() {
    const maps = await getMindMaps();

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Mind Maps</h1>
                <CreateMindMapButton />
            </div>

            {maps.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    No mind maps found. Create one to get started.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {maps.map((map) => (
                        <div key={map.id} className="relative group h-full">
                            <Link href={`/instructor/mind-maps/${map.id}`} className="block h-full">
                                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col justify-between relative">
                                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                        <div className="p-2 bg-sky-100 rounded-md">
                                            <FileText className="h-6 w-6 text-sky-700" />
                                        </div>
                                        <div>
                                            <CardTitle className="line-clamp-1">{map.title}</CardTitle>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {format(new Date(map.updated_at), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                    </CardHeader>
                                    <CardFooter className="pt-0">
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {map.description || 'No description'}
                                        </p>
                                    </CardFooter>
                                </Card>
                            </Link>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <DeleteMindMapButton id={map.id} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
