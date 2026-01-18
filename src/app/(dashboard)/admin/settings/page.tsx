import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Globe, Mail, CreditCard } from "lucide-react";

export default function AdminSettingsPage() {
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-600 mt-1">Configure platform-wide settings</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-purple-600" />
                            <CardTitle>General Settings</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Platform Name</label>
                                <input
                                    type="text"
                                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50"
                                    value="ADH Connect"
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Platform URL</label>
                                <input
                                    type="text"
                                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50"
                                    value="https://adh.today"
                                    disabled
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-blue-600" />
                            <CardTitle>Email Settings</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-6">
                            <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Email configuration coming soon</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-green-600" />
                            <CardTitle>Payment Settings</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-6">
                            <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Payment gateway configuration coming soon</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5 text-orange-600" />
                            <CardTitle>Advanced Settings</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-6">
                            <SettingsIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Feature flags and advanced options coming soon</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
