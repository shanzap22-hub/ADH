"use server";

import { sendMail } from "@/lib/mail";

export async function submitContactForm(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const message = formData.get("message") as string;

    if (!name || !email || !message) {
        return { error: "Please fill in all required fields." };
    }

    try {
        const htmlContent = `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br>")}</p>
        `;

        await sendMail({
            to: "shanzap22@gmail.com",
            subject: `New Contact Request from ${name}`,
            body: htmlContent,
        });

        return { success: "Message sent successfully!" };
    } catch (error) {
        console.error("Error sending contact email:", error);
        return { error: "Failed to send message. Please try again later." };
    }
}
