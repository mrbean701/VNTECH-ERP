-- D5 rollback: trả PO test về waiting_delivery (18/09)
UPDATE purchase_orders SET status='waiting_delivery' WHERE id='PO_0843c57c-8531-483a-919e-d99712e3da9e';

