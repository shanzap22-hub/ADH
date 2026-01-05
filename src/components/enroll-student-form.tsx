"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface EnrollStudentFormProps {
    courses: Array<{
        id: string;
        title: string;
    }>;
}

export const EnrollStudentForm = ({ courses }: EnrollStudentFormProps) => {
    const [studentEmail, setStudentEmail] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!studentEmail || !selectedCourse) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch("/api/instructor/enroll", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    studentEmail: studentEmail.toLowerCase().trim(),
                    courseId: selectedCourse,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to enroll student");
            }

            const data = await response.json();

            toast.success(`Successfully enrolled ${data.student.name || data.student.email}`);
            setStudentEmail("");
            setSelectedCourse("");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to enroll student");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Enroll Student Manually
                </CardTitle>
                <CardDescription>
                    Grant a student access to a course without requiring payment
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Student Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="student@example.com"
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            The student must have a registered account
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="course">Select Course</Label>
                        <Select
                            value={selectedCourse}
                            onValueChange={setSelectedCourse}
                            disabled={isLoading}
                        >
                            <SelectTrigger id="course">
                                <SelectValue placeholder="Choose a course" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground">
                                        No courses available
                                    </div>
                                ) : (
                                    courses.map((course) => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.title}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || courses.length === 0}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enroll Student
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
