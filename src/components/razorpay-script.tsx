"use client";

import Script from "next/script";

export const RazorpayScript = () => {
    return (
        <Script
            id="razorpay-checkout-js"
            src="https://checkout.razorpay.com/v1/checkout.js"
        />
    );
};
