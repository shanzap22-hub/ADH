// Usage Example: Secure In-App Browser
// How to use secure browser in your components

'use client';

import { useSecureBrowser } from '@/lib/secure-browser';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CourseWithExternalLinks({ course }: { course: any }) {
    const { openLink, canOpen, openCourseResource } = useSecureBrowser();

    return (
        <div>
            <h2>{course.title}</h2>

            {/* Example 1: Open course resource */}
            {course.externalResource && (
                <Button
                    onClick={() => openCourseResource(course.externalResource)}
                    variant="outline"
                >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Resource
                </Button>
            )}

            {/* Example 2: Open YouTube video */}
            {course.youtubeId && (
                <Button
                    onClick={async () => {
                        const { secureBrowser } = await import('@/lib/secure-browser');
                        await secureBrowser.openYouTube(course.youtubeId);
                    }}
                    variant="outline"
                >
                    Watch on YouTube
                </Button>
            )}

            {/* Example 3: Conditional rendering based on URL trust */}
            {course.links?.map((link: any) => {
                const isSafe = canOpen(link.url);

                return (
                    <div key={link.id} className="flex items-center gap-2">
                        <Button
                            onClick={() => isSafe && openLink(link.url)}
                            disabled={!isSafe}
                            variant={isSafe ? 'default' : 'ghost'}
                        >
                            {link.title}
                            {!isSafe && <span className="ml-2 text-xs">(Blocked)</span>}
                        </Button>
                    </div>
                );
            })}
        </div>
    );
}

// Example 4: Open link with custom toolbar color
export async function openCourseLink(url: string) {
    const { secureBrowser } = await import('@/lib/secure-browser');

    try {
        await secureBrowser.open(url, {
            title: 'Course Material',
            toolbarColor: '#4f46e5', // Your brand color
            showTitle: true,
        });
    } catch (error) {
        alert('This link cannot be opened for security reasons');
    }
}

// Example 5: Handle external links in course content
export function CourseContent({ htmlContent }: { htmlContent: string }) {
    const handleClick = async (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');

        if (link?.href) {
            e.preventDefault();

            const { secureBrowser } = await import('@/lib/secure-browser');

            try {
                await secureBrowser.open(link.href);
            } catch (error) {
                console.error('Cannot open link:', error);
                alert('This link cannot be opened');
            }
        }
    };

    return (
        <div
            onClick={handleClick}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            className="prose dark:prose-invert"
        />
    );
}
