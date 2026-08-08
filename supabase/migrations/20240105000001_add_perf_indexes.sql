-- Add performance indexes for foreign keys and status queries
CREATE INDEX IF NOT EXISTS idx_document_requests_requester_id ON public.document_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_document_requests_status ON public.document_requests(status);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
