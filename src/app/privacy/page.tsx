// 2026 Performance: 1-hour cache for static legal content
export const revalidate = 3600;

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 p-8 md:p-12">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-slate-400 mb-8">Last updated: January 5, 2026</p>

                    <div className="prose prose-slate prose-invert max-w-none">
                        <div className="space-y-6 text-slate-300">
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                                <p>
                                    Welcome to ADH CONNECT, operated by Atcess. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at https://adh.today.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
                                <p>
                                    We collect personal information that you voluntarily provide to us when you register on ADH CONNECT, enroll in courses, or participate in our community. The personal information we collect includes:
                                </p>
                                <ul className="list-disc pl-6 mt-3 space-y-2">
                                    <li><strong>Contact Information:</strong> Name, email address, phone number</li>
                                    <li><strong>Account Credentials:</strong> Username and password</li>
                                    <li><strong>Payment Information:</strong> Billing details processed securely through Razorpay</li>
                                    <li><strong>Profile Information:</strong> WhatsApp number for community access</li>
                                    <li><strong>Usage Data:</strong> Course progress, completion status, engagement metrics</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                                <p>
                                    We use the information we collect or receive for the following purposes:
                                </p>
                                <ul className="list-disc pl-6 mt-3 space-y-2">
                                    <li>To provide access to ADH CONNECT courses and community</li>
                                    <li>To process your payments and manage your enrollment</li>
                                    <li>To send you course updates, educational content, and important notices</li>
                                    <li>To improve our platform and course offerings</li>
                                    <li>To respond to your inquiries and provide customer support</li>
                                    <li>To track course completion and issue certificates</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
                                <p>
                                    We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All payment transactions are processed through Razorpay's secure payment gateway, which is PCI DSS compliant.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">5. Data Sharing and Disclosure</h2>
                                <p>
                                    <strong>We DO NOT sell your personal information to third parties.</strong>
                                </p>
                                <p className="mt-3">
                                    We may share your information only in the following circumstances:
                                </p>
                                <ul className="list-disc pl-6 mt-3 space-y-2">
                                    <li><strong>Service Providers:</strong> With trusted third-party service providers (e.g., Razorpay for payments, email service providers) who assist us in operating our platform</li>
                                    <li><strong>Legal Requirements:</strong> If required by law or in response to valid legal processes</li>
                                    <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, or acquisition</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">6. Cookies and Tracking Technologies</h2>
                                <p>
                                    We use cookies and similar tracking technologies to track activity on our platform and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
                                <p>
                                    We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">8. Your Privacy Rights</h2>
                                <p>
                                    You have the right to:
                                </p>
                                <ul className="list-disc pl-6 mt-3 space-y-2">
                                    <li>Access and receive a copy of your personal data</li>
                                    <li>Request correction of inaccurate or incomplete data</li>
                                    <li>Request deletion of your personal data</li>
                                    <li>Object to or restrict processing of your data</li>
                                    <li>Withdraw consent at any time</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
                                <p>
                                    ADH CONNECT is intended for use by individuals aged 18 years and older. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">10. Third-Party Links</h2>
                                <p>
                                    Our platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Privacy Policy</h2>
                                <p>
                                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
                                <p>
                                    If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
                                </p>
                                <div className="mt-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <p className="font-semibold text-white">Atcess</p>
                                    <p>Email: <a href="mailto:info@adh.today" className="text-orange-400 hover:text-orange-300">info@adh.today</a></p>
                                    <p>Phone: <a href="tel:+917591977888" className="text-orange-400 hover:text-orange-300">+91 7591977888</a></p>
                                    <p className="mt-2 text-sm">
                                        CKM COMPLEX, Ground Floor, Manjambra Road,<br />
                                        East Chembulangad, Cherukudangad Post, Parudur,<br />
                                        679305, Palakkad, Kerala
                                    </p>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
