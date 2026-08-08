import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/privacy')({
  component: () => (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">This is the privacy policy for BrgyConnect. We take your privacy seriously and are committed to protecting your personal information.</p>
    </div>
  ),
})
