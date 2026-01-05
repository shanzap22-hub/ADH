export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 p-8 md:p-12">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
                        Terms & Conditions
                    </h1>
                    <p className="text-slate-400 mb-8">Last updated: January 5, 2026</p>

                    <div className="prose prose-slate prose-invert max-w-none">
                        <div className="space-y-6 text-slate-300">
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                                <p>
                                    Welcome to ADH CONNECT, an educational platform operated by Atcess. By accessing or using our platform at https://adh.today, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access our services.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">2. Use of Platform</h2>
                                <p>
                                    ADH CONNECT provides online courses and community access focused on social media marketing (Meta ads), AI automation, and personal branding for business owners. You agree to use the platform solely for legitimate learning purposes and in accordance with all applicable laws and regulations.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">3. Intellectual Property Rights</h2>
                                <p>
                                    All course content, including but not limited to videos, text, graphics, logos, and software, is the exclusive property of Atcess and is protected by Indian and international copyright, trademark, and other intellectual property laws.
                                </p>
                                <p className="mt-3">
                                    <strong>You are NOT permitted to:</strong>
                                </p>
                                <ul className="list-disc pl-6 mt-2 space-y-2">
                                    <li>Share, distribute, or resell any course materials</li>
                                    <li>Record, screenshot, or copy course videos and content</li>
                                    <li>Use course content for commercial purposes</li>
                                    <li>Share your account credentials with others</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">4. Account Registration</h2>
                                <p>
                                    To access ADH CONNECT, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">5. Payment and Enrollment</h2>
                                <p>
                                    Access to ADH CONNECT courses requires payment of the applicable fees. All payments are processed securely through Razorpay. Upon successful payment, you will receive immediate access to enrolled courses.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">6. User Conduct in Community</h2>
                                <p>
                                    When participating in the ADH CONNECT community, you agree to:
                                </p>
                                <ul className="list-disc pl-6 mt-2 space-y-2">
                                    <li>Treat all members with respect and professionalism</li>
                                    <li>Not post spam, offensive, or illegal content</li>
                                    <li>Not engage in harassment, discrimination, or harmful behavior</li>
                                    <li>Respect the privacy and intellectual property of others</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">7. Termination</h2>
                                <p>
                                    We reserve the right to suspend or terminate your access to ADH CONNECT at any time, without prior notice, for conduct that we believe violates these Terms and Conditions or is harmful to other users, us, or third parties, or for any other reason.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
                                <p>
                                    ADH CONNECT and Atcess shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the platform or course materials.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">9. Changes to Terms</h2>
                                <p>
                                    We reserve the right to modify these Terms and Conditions at any time. We will notify users of any material changes via email or through the platform. Continued use of ADH CONNECT after such modifications constitutes acceptance of the updated terms.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">10. Governing Law</h2>
                                <p>
                                    These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Palakkad, Kerala.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">11. Contact Information</h2>
                                <p>
                                    For any questions about these Terms and Conditions, please contact us at:
                                </p>
                                <div className="mt-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <p className="font-semibold text-white">Atcess</p>
                                    <p>Email: <a href="mailto:info@atcess.com" className="text-orange-400 hover:text-orange-300">info@atcess.com</a></p>
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
