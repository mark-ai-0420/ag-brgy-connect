import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/terms')({
  component: () => (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4">These are the terms of service for BrgyConnect. By using this service, you agree to these terms.</p>
    </div>
  ),
})
