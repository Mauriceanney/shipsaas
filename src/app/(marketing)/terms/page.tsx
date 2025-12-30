import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for ShipSaaS",
};

export default function TermsPage() {
  const lastUpdated = "December 30, 2025";

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using our service, you agree to be bound by these
            Terms of Service and our{" "}
            <Link
              href="/privacy"
              className="text-primary underline hover:no-underline"
            >
              Privacy Policy
            </Link>
            . If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
          <p>
            We provide a software-as-a-service (SaaS) platform that enables users
            to [describe your service]. The service is provided &quot;as is&quot; and
            we reserve the right to modify, suspend, or discontinue any aspect
            of the service at any time.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
          <p>To use our service, you must:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Be at least 18 years old or have parental consent</li>
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Accept responsibility for all activities under your account</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights of others</li>
            <li>Upload malicious code or attempt to breach security</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Use the service for spam or unauthorized advertising</li>
            <li>Attempt to reverse engineer or copy the service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Subscription and Payments</h2>
          <p>
            Paid subscriptions are billed in advance on a monthly or annual
            basis. All payments are processed securely through Stripe.
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Prices are subject to change with 30 days notice</li>
            <li>Refunds are provided in accordance with our refund policy</li>
            <li>Failed payments may result in service suspension</li>
            <li>You may cancel your subscription at any time</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Intellectual Property</h2>
          <p>
            The service, including all content, features, and functionality, is
            owned by us and protected by copyright, trademark, and other
            intellectual property laws. You retain ownership of any content you
            create using our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, we shall not be liable for
            any indirect, incidental, special, consequential, or punitive
            damages, including loss of profits, data, or business opportunities,
            arising from your use of the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Disclaimer of Warranties</h2>
          <p>
            The service is provided &quot;as is&quot; and &quot;as available&quot; without
            warranties of any kind, either express or implied, including but not
            limited to implied warranties of merchantability, fitness for a
            particular purpose, and non-infringement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account at any
            time for violation of these terms. Upon termination, your right to
            use the service will immediately cease. You may also terminate your
            account at any time through your account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">10. Changes to Terms</h2>
          <p>
            We may update these Terms of Service from time to time. We will
            notify you of any material changes by email or by posting a notice
            on our website. Your continued use of the service after changes
            become effective constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">11. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with
            the laws of [Your Jurisdiction], without regard to its conflict of
            law provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">12. Contact Information</h2>
          <p>
            For questions about these Terms of Service, contact us at:{" "}
            <a
              href="mailto:legal@example.com"
              className="text-primary underline hover:no-underline"
            >
              legal@example.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
