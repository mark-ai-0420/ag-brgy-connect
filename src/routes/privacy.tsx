import { createFileRoute } from '@tanstack/react-router'
import { Shield, Lock, FileText, UserCheck, Eye, Trash2 } from 'lucide-react'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPolicy,
})

function PrivacyPolicy() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-lg text-muted-foreground">
          Barangay Daine, Indang, Cavite • Last Updated: August 2026
        </p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            1. Introduction & Scope
          </h2>
          <p>
            Welcome to the official digital portal of <strong>Barangay Daine, Indang, Cavite</strong> ("BrgyConnect"). 
            We are committed to protecting your privacy and ensuring the security of your personal information in full compliance with 
            <strong>Republic Act No. 10173</strong>, also known as the <em>Data Privacy Act of 2012</em> (DPA), its Implementing Rules and Regulations, and other relevant laws of the Republic of the Philippines.
          </p>
          <p className="mt-2">
            This Privacy Policy applies to all residents, business owners, and individuals who use the BrgyConnect portal to access barangay services, request documents, report incidents, and participate in community affairs.
          </p>
        </section>

        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" />
            2. Information We Collect
          </h2>
          <p>We only collect personal information that is reasonably necessary to provide barangay services to you. The data we collect includes, but is not limited to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Resident Records:</strong> Full name, date of birth, civil status, gender, nationality, and contact details (mobile number, email address).</li>
            <li><strong>Identification Details:</strong> Government-issued ID numbers (e.g., PhilSys/National ID, Voter's ID) and uploaded ID photos for verification.</li>
            <li><strong>Residential Information:</strong> Exact address within Barangay Daine, length of stay, and household composition.</li>
            <li><strong>Business Registrations:</strong> Business name, owner details, DTI/SEC registration, and nature of business for Barangay Clearance issuance.</li>
            <li><strong>Incident Reports (Blotters):</strong> Details of reported incidents, names of involved parties, locations, and supporting evidence (photos, documents) submitted via the online blotter system.</li>
          </ul>
        </section>

        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6 text-primary" />
            3. Purpose of Data Processing
          </h2>
          <p>Your personal data is collected and processed exclusively for legitimate barangay governance and service delivery purposes:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>To verify your identity and residency status in Barangay Daine.</li>
            <li>To process and issue official barangay documents (e.g., Barangay Clearance, Certificate of Residency, Indigency).</li>
            <li>To manage and respond to emergency requests and incident reports.</li>
            <li>To maintain an accurate registry of inhabitants (RBI) as mandated by the Local Government Code.</li>
            <li>To communicate official announcements, community advisories, and emergency alerts.</li>
          </ul>
        </section>

        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            4. Data Protection & Encryption
          </h2>
          <p>
            We implement strict organizational, physical, and technical security measures to protect your personal data against accidental loss, unauthorized access, destruction, or alteration. All data transmitted through the BrgyConnect portal is secured using end-to-end encryption (HTTPS/TLS), and sensitive records are stored in secure, access-controlled database environments. Only authorized barangay officials and personnel are permitted to handle your data.
          </p>
        </section>

        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Eye className="w-6 h-6 text-primary" />
            5. Resident Rights
          </h2>
          <p>Under the Data Privacy Act of 2012, you have the following rights regarding your personal information:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Right to be Informed:</strong> You have the right to know how your data is being processed.</li>
            <li><strong>Right to Access:</strong> You can request a copy of the personal data we hold about you.</li>
            <li><strong>Right to Rectify:</strong> You may correct or update inaccurate or incomplete information in your profile.</li>
            <li><strong>Right to Erase/Block:</strong> You have the right to request the suspension, withdrawal, or removal of your data if it is no longer necessary for the purpose it was collected, subject to legal retention requirements.</li>
            <li><strong>Right to Object:</strong> You may object to the processing of your data if it is used for purposes outside of official barangay functions.</li>
          </ul>
        </section>

        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-primary" />
            6. Retention Period
          </h2>
          <p>
            We will retain your personal information only for as long as you are a resident of Barangay Daine or as long as necessary to fulfill the purposes outlined in this policy. Certain records, such as blotter reports and issued clearances, may be retained for longer periods as required by the Department of the Interior and Local Government (DILG) and other national record-keeping laws. Upon expiration of the retention period, physical records will be securely shredded and digital records permanently deleted.
          </p>
        </section>

        <section className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">7. Data Protection Officer Contact</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact our designated Data Protection Officer (DPO):
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p><strong>Office of the Barangay Chairman / DPO</strong></p>
            <p>Barangay Hall, Barangay Daine, Indang, Cavite</p>
            <p>Email: <a href="mailto:dpo@brgydaine.gov.ph" className="text-primary hover:underline">dpo@brgydaine.gov.ph</a></p>
            <p>Contact No: (046) 415-XXXX</p>
          </div>
        </section>
      </div>
    </div>
  )
}
