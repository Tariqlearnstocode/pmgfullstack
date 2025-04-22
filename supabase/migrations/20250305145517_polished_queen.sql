/*
  # Add Move-in Payment Transaction Type

  1. New Transaction Type
    - Add "Move-in Payment" transaction type for recording initial move-in payments
    - Category: Payment
    - Display name: Move-in Payment
*/

INSERT INTO transaction_types (name, category, display_name)
VALUES ('move_in_payment', 'Payment', 'Move-in Payment');