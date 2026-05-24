-- Reject all pending commissions
UPDATE commissions 
SET status = 'rejected' 
WHERE status = 'pending';
