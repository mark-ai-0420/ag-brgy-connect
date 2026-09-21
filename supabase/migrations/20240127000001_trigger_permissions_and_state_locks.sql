-- Grant execute privilege on notify_document_status_change to authenticated
GRANT EXECUTE ON FUNCTION public.notify_document_status_change() TO authenticated;
