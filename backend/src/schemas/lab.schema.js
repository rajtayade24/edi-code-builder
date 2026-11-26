import { z } from 'zod';

const optionalText = (max) => z.string().trim().max(max).optional().or(z.literal(''));
const optionalNumber = z.number().finite().min(-100000000).max(100000000).optional().nullable();
const optionalDateTime = z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date and time.').optional().or(z.literal(''));

export const labResultSchema = z.object({
  labCode: optionalText(60),
  testName: z.string().trim().min(1).max(180),
  numericValue: optionalNumber,
  resultText: optionalText(2000),
  unit: optionalText(50),
  referenceRangeLow: optionalNumber,
  referenceRangeHigh: optionalNumber,
  collectedAt: optionalDateTime,
  resultStatus: z.enum(['PRELIMINARY', 'FINAL', 'CORRECTED', 'CANCELLED']).optional(),
  notes: optionalText(3000),
}).refine((value) => value.numericValue != null || Boolean(value.resultText?.trim()), {
  message: 'Provide a numeric value or a text result.',
  path: ['numericValue'],
}).refine((value) => value.referenceRangeLow == null || value.referenceRangeHigh == null || value.referenceRangeLow <= value.referenceRangeHigh, {
  message: 'Reference range low must not exceed reference range high.',
  path: ['referenceRangeHigh'],
});
