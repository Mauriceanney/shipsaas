import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy and data handling practices for ShipSaaS",
};

export default function PrivacyPage() {
  const lastUpdated = "December 29, 2025";

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
          <p>
            This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our service. We are
            committed to protecting your privacy and ensuring you understand how
            your data is handled.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Data We Collect</h2>
          <p>We collect information you provide directly to us:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>
              <strong>Account Information:</strong> Email address, name, and
              profile picture when you create an account
            </li>
            <li>
              <strong>Payment Information:</strong> Processed securely via
              Stripe. We do not store your full credit card details
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you use our
              service, including features accessed and preferences
            </li>
            <li>
              <strong>Communication Data:</strong> Records of your
              communications with us
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            3. How We Use Your Data
          </h2>
          <p>Your data is used to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and manage your subscription</li>
            <li>Send important account notifications and updates</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address technical issues</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            4. Data Sharing and Third Parties
          </h2>
          <p>We share your data with the following third parties:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>
              <strong>Stripe:</strong> For payment processing
            </li>
            <li>
              <strong>Authentication Providers:</strong> Google, GitHub for
              OAuth login
            </li>
            <li>
              <strong>Email Service:</strong> For transactional emails
            </li>
          </ul>
          <p className="mt-4">
            We do not sell your personal information to third parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Data Retention</h2>
          <p>
            We retain your personal data while your account is active or as
            needed to provide services. Upon account deletion, your data is
            permanently removed after a 30-day grace period. Some data may be
            retained for legal or tax compliance purposes (e.g., invoice
            records).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            6. Your Rights (GDPR)
          </h2>
          <p>Under GDPR and similar regulations, you have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>
              <strong>Access:</strong> Request a copy of your personal data
            </li>
            <li>
              <strong>Rectification:</strong> Request correction of inaccurate
              data
            </li>
            <li>
              <strong>Erasure:</strong> Request deletion of your data (Right to
              be Forgotten)
            </li>
            <li>
              <strong>Portability:</strong> Export your data in a
              machine-readable format
            </li>
            <li>
              <strong>Restriction:</strong> Request limitation of data
              processing
            </li>
            <li>
              <strong>Objection:</strong> Object to processing based on
              legitimate interests
            </li>
          </ul>
          <p className="mt-4">
            Exercise these rights in your{" "}
            <Link
              href="/settings/privacy"
              className="text-primary underline hover:no-underline"
            >
              Privacy Settings
            </Link>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to
            protect your personal data, including:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments</li>
            <li>Access controls and authentication</li>
            <li>Secure hosting infrastructure</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management.
            These are necessary for the service to function properly. We do not
            use tracking cookies for advertising purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            9. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new policy on this page and
            updating the &quot;Last updated&quot; date. Significant changes will
            be communicated via email.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">10. Contact Us</h2>
          <p>
            For privacy-related inquiries or to exercise your rights, contact
            us at:{" "}
            <a
              href="mailto:privacy@example.com"
              className="text-primary underline hover:no-underline"
            >
              privacy@example.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
