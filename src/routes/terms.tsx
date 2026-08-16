import { createFileRoute } from '@tanstack/react-router'
import { Scale, BookOpen, FileCheck, AlertOctagon, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/terms')({
  component: TermsOfService,
})

function TermsOfService() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
          <Scale className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
        <p className="text-lg text-muted-foreground">
          Barangay Daine Digital Portal • Last Updated: August 2026
        </p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing and using the BrgyConnect portal ("Service"), you accept and agree to be bound by the terms and provision of this agreement. 
            This Service is operated by the local government unit of <strong>Barangay Daine, Indang, Cavite</strong>. If you do not agree to abide by these Terms of Service, you are not authorized to use or access the portal.
          </p>
        </section>

        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            2. Resident & Business Account Responsibilities
          </h2>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Accuracy of Information:</strong> You agree to provide true, accurate, current, and complete information when registering an account, requesting documents, or filing reports.</li>
            <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials (email and password) and for all activities that occur under your account.</li>
            <li><strong>Eligibility:</strong> The portal is intended for use by verified residents, property owners, and business operators within the jurisdiction of Barangay Daine, Indang, Cavite.</li>
          </ul>
        </section>

        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-primary" />
            3. Online Document Requests & Issuance
          </h2>
          <p>
            The BrgyConnect portal allows residents to request official documents such as Barangay Clearances, Certificates of Indigency, and Business Clearances online. 
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Processing Time:</strong> While we strive for prompt service, processing times may vary based on the volume of requests and the availability of authorized signatories (e.g., the Punong Barangay).</li>
            <li><strong>Fees:</strong> Standard regulatory fees imposed by the Barangay Revenue Ordinance remain applicable. Payments must be settled as directed before or upon the release of the physical document.</li>
            <li><strong>Verification:</strong> The Barangay reserves the right to withhold the issuance of any document if the provided information is found to be false, or if the requester has pending derogatory records.</li>
          </ul>
        </section>

        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-primary" />
            4. Reporting & Blotter Incident Submissions
          </h2>
          <p>
            The online reporting and blotter system is designed to streamline the logging of community incidents, complaints, and disputes.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Truthfulness:</strong> All reports submitted must be truthful and filed in good faith.</li>
            <li><strong>Mediation:</strong> Submission of an online blotter does not immediately constitute a formal legal charge. It serves as an initial record and will undergo the standard Katarungang Pambarangay (Barangay Justice System) mediation processes where applicable.</li>
          </ul>
        </section>

        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">
            5. Prohibited Activities
          </h2>
          <p>Users are strictly prohibited from:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>Submitting <strong>fraudulent claims</strong>, fake identities, or forged supporting documents.</li>
            <li>Filing <strong>malicious, false, or vexatious blotter reports</strong> intended to harass other residents.</li>
            <li>Attempting to hack, disrupt, or compromise the security and functionality of the BrgyConnect portal.</li>
          </ul>
          <p className="mt-2 text-destructive font-medium">
            Violation of these terms may result in the suspension or permanent termination of your account and may subject you to criminal or civil liability under Philippine laws, including the Cybercrime Prevention Act of 2012 (RA 10175).
          </p>
        </section>

        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
          <p>
            All content, logos, graphics, and software associated with the BrgyConnect portal are the property of the Barangay Daine Local Government Unit or its licensors and are protected by applicable intellectual property laws. You may not reproduce or distribute any materials without explicit permission.
          </p>
        </section>

        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
          <p>
            The BrgyConnect portal is provided on an "as is" and "as available" basis. While we strive to ensure 100% uptime, the Barangay Daine LGU shall not be held liable for any service interruptions, data loss, or delays resulting from technical issues, maintenance, or force majeure events.
          </p>
        </section>

        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">8. Governing Law</h2>
          <p>
            These Terms of Service shall be governed by and construed in accordance with the laws of the <strong>Republic of the Philippines</strong>. Any disputes arising from the use of this portal shall be subject to the exclusive jurisdiction of the competent courts in Cavite.
          </p>
        </section>
      </div>
    </div>
  )
}
