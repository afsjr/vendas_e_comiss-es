-- Feature 010: registra a data efetiva em que a comissão foi paga.
-- Aditivo: comissões antigas já PAGA ficam com data_pagamento nula
-- (exibidas como "data não registrada" na interface).

ALTER TABLE public.comissoes
  ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMP WITH TIME ZONE;

NOTIFY pgrst, 'reload schema';
