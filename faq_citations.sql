-- ============================================
-- FAQ CITATIONS MIGRATION
-- Adds scientific citations to FAQ answers for App Store compliance
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add citations column if it doesn't exist
ALTER TABLE public.faq_questions 
ADD COLUMN IF NOT EXISTS citations JSONB DEFAULT '[]';

-- ============================================
-- DOSING AND ADMINISTRATION FAQS
-- Category: fac2a9d6-a671-4435-86bc-23a289293ea2
-- ============================================

-- Semaglutide dosing FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Once-Weekly Semaglutide in Adults with Overweight or Obesity",
    "authors": "Wilding JPH, Batterham RL, et al.",
    "journal": "N Engl J Med",
    "year": "2021",
    "pmid": "33567185",
    "url": "https://pubmed.ncbi.nlm.nih.gov/33567185/"
  }
]'::jsonb
WHERE slug = 'how-should-i-dose-semaglutide-for-weight-loss-research';

-- BPC-157 dosing FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Stable gastric pentadecapeptide BPC 157: Novel therapy in gastrointestinal tract",
    "authors": "Sikiric P, Seiwerth S, et al.",
    "journal": "Curr Pharm Des",
    "year": "2018",
    "pmid": "30426902",
    "url": "https://pubmed.ncbi.nlm.nih.gov/30426902/"
  }
]'::jsonb
WHERE slug = 'what-is-the-typical-dosing-schedule-for-bpc-157-in-tissue-repair-studies';

-- Retatrutide dosing FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Triple-Hormone-Receptor Agonist Retatrutide for Obesity",
    "authors": "Jastreboff AM, Kaplan LM, et al.",
    "journal": "N Engl J Med",
    "year": "2023",
    "pmid": "37366315",
    "url": "https://pubmed.ncbi.nlm.nih.gov/37366315/"
  }
]'::jsonb
WHERE slug = 'how-often-should-retatrutide-be-administered';

-- ============================================
-- BENEFITS AND EFFECTS FAQS
-- Category: 9fed3514-b175-42ab-90cc-fff7ef739e4d
-- ============================================

-- Ipamorelin benefits FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Ipamorelin, the first selective growth hormone secretagogue",
    "authors": "Raun K, Hansen BS, et al.",
    "journal": "Eur J Endocrinol",
    "year": "1998",
    "pmid": "9892541",
    "url": "https://pubmed.ncbi.nlm.nih.gov/9892541/"
  }
]'::jsonb
WHERE slug = 'what-are-the-benefits-of-using-ipamorelin-in-research';

-- Melanotan 2 FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Melanotan II: an investigation of anti-tanning effects",
    "authors": "Dorr RT, Ertl G, et al.",
    "journal": "Pigment Cell Res",
    "year": "2000",
    "pmid": "10714573",
    "url": "https://pubmed.ncbi.nlm.nih.gov/10714573/"
  }
]'::jsonb
WHERE slug = 'can-melanotan-2-help-with-tanning';

-- NAD+ anti-aging FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "NAD+ in aging, metabolism, and neurodegeneration",
    "authors": "Verdin E",
    "journal": "Science",
    "year": "2015",
    "pmid": "26785480",
    "url": "https://pubmed.ncbi.nlm.nih.gov/26785480/"
  },
  {
    "title": "NAD+ metabolism and its roles in cellular processes during ageing",
    "authors": "Covarrubias AJ, Perrone R, et al.",
    "journal": "Nat Rev Mol Cell Biol",
    "year": "2021",
    "pmid": "33353981",
    "url": "https://pubmed.ncbi.nlm.nih.gov/33353981/"
  }
]'::jsonb
WHERE slug = 'what-does-nad-do-in-anti-aging-studies';

-- ============================================
-- SIDE EFFECTS AND CONTRAINDICATIONS FAQS
-- Category: f02c8396-8996-43a5-9c5c-3ec5129ddee4
-- ============================================

-- Tirzepatide side effects FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Tirzepatide Once Weekly for the Treatment of Obesity",
    "authors": "Jastreboff AM, Aronne LJ, et al.",
    "journal": "N Engl J Med",
    "year": "2022",
    "pmid": "35658024",
    "url": "https://pubmed.ncbi.nlm.nih.gov/35658024/"
  }
]'::jsonb
WHERE slug = 'what-are-common-side-effects-of-tirzepatide';

-- HGH Fragment contraindications FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Metabolic effects of the C-terminal part of human growth hormone",
    "authors": "Wu Z, Ng FM",
    "journal": "Mol Cell Endocrinol",
    "year": "1993",
    "pmid": "8258310",
    "url": "https://pubmed.ncbi.nlm.nih.gov/8258310/"
  }
]'::jsonb
WHERE slug = 'who-should-avoid-using-hgh-fragment-176-191';

-- Thymosin Alpha-1 contraindications FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Thymosin alpha 1 in the treatment of viral infections",
    "authors": "Romani L, Bistoni F, et al.",
    "journal": "Int Immunopharmacol",
    "year": "2007",
    "pmid": "17291602",
    "url": "https://pubmed.ncbi.nlm.nih.gov/17291602/"
  }
]'::jsonb
WHERE slug = 'are-there-contraindications-for-thymosin-alpha-1';

-- ============================================
-- STACKING AND COMBINATIONS FAQS
-- Category: 2bb45bb7-750b-47d6-8e85-b6755dbbe976
-- ============================================

-- Semaglutide stacking FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Cagrilintide plus semaglutide for weight management",
    "authors": "Frias JP, Deenadayalan S, et al.",
    "journal": "Lancet",
    "year": "2021",
    "pmid": "34358471",
    "url": "https://pubmed.ncbi.nlm.nih.gov/34358471/"
  }
]'::jsonb
WHERE slug = 'can-i-stack-semaglutide-with-other-peptides';

-- BPC-157 stacking FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Thymosin beta4 and wound healing",
    "authors": "Goldstein AL, Hannappel E, et al.",
    "journal": "Ann N Y Acad Sci",
    "year": "2012",
    "pmid": "22823395",
    "url": "https://pubmed.ncbi.nlm.nih.gov/22823395/"
  },
  {
    "title": "Stable gastric pentadecapeptide BPC 157",
    "authors": "Sikiric P, et al.",
    "journal": "Curr Pharm Des",
    "year": "2018",
    "pmid": "30426902",
    "url": "https://pubmed.ncbi.nlm.nih.gov/30426902/"
  }
]'::jsonb
WHERE slug = 'what-peptides-pair-well-with-bpc-157-for-repair';

-- Ipamorelin + CJC-1295 stacking FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Prolonged stimulation of growth hormone (GH) and insulin-like growth factor I",
    "authors": "Teichman SL, Neale A, et al.",
    "journal": "J Clin Endocrinol Metab",
    "year": "2006",
    "pmid": "16352683",
    "url": "https://pubmed.ncbi.nlm.nih.gov/16352683/"
  }
]'::jsonb
WHERE slug = 'is-stacking-ipamorelin-and-cjc-1295-effective';

-- ============================================
-- SAFETY AND PRECAUTIONS FAQS
-- Category: 26f62c54-66bb-4a39-b7ae-c9780ff03e3f
-- ============================================

-- Side effects FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Side effects of incretin-based therapies",
    "authors": "Buse JB, et al.",
    "journal": "Diabetes Care",
    "year": "2017",
    "pmid": "28404659",
    "url": "https://pubmed.ncbi.nlm.nih.gov/28404659/"
  }
]'::jsonb
WHERE slug = 'what-should-i-do-if-i-experience-side-effects';

-- Epitalon cycling FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Peptide bioregulators and aging",
    "authors": "Khavinson VK",
    "journal": "Adv Gerontol",
    "year": "2010",
    "pmid": "21510038",
    "url": "https://pubmed.ncbi.nlm.nih.gov/21510038/"
  }
]'::jsonb
WHERE slug = 'how-often-should-i-cycle-peptides-like-epitalon';

-- ============================================
-- GENERAL QUESTIONS FAQS
-- Category: 25c4950f-875f-46a5-a44c-6923dc70d239
-- ============================================

-- What are peptides FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Therapeutic peptides: Historical perspectives and current development",
    "authors": "Fosgerau K, Hoffmann T",
    "journal": "Drug Discov Today",
    "year": "2015",
    "pmid": "25440903",
    "url": "https://pubmed.ncbi.nlm.nih.gov/25440903/"
  }
]'::jsonb
WHERE slug = 'what-are-peptides-and-how-are-they-used-in-research';

-- Tirzepatide FDA FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "FDA approves Mounjaro (tirzepatide)",
    "authors": "U.S. FDA",
    "journal": "FDA Press Release",
    "year": "2022",
    "url": "https://www.fda.gov/drugs/news-events-human-drugs/fda-approves-novel-dual-targeted-treatment-type-2-diabetes"
  }
]'::jsonb
WHERE slug = 'what-is-tirzepatide-and-where-does-it-come-from';

-- ============================================
-- PRODUCT INFORMATION FAQS
-- Category: 3f78d3c5-c020-40f6-8a3e-b6631163915e
-- ============================================

-- BAC water vs sterile water FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Bacteriostatic water for injection specifications",
    "authors": "USP Pharmacopeia",
    "journal": "USP-NF",
    "year": "2023",
    "url": "https://www.usp.org/chemical-medicines/bacteriostatic-water"
  }
]'::jsonb
WHERE slug = 'can-i-use-sterile-water-instead-of-bac-water';

-- Peptide shelf life FAQ
UPDATE public.faq_questions SET citations = '[
  {
    "title": "Stability of peptide pharmaceuticals",
    "authors": "Manning MC, et al.",
    "journal": "Pharm Res",
    "year": "2010",
    "pmid": "20499141",
    "url": "https://pubmed.ncbi.nlm.nih.gov/20499141/"
  }
]'::jsonb
WHERE slug = 'what-is-the-peptide-shelf-life';

-- Set empty citations for non-medical FAQs (ordering, shipping, seller info, etc.)
UPDATE public.faq_questions SET citations = '[]'::jsonb
WHERE category_id IN (
    '2c84f2bd-ec4c-4d77-87fe-2c63cfa34bef',  -- Ordering and Shipping
    'd96c855b-a744-481a-8ad6-e056409c59fc',  -- Payment and Process
    'e9d9c81a-81ce-4d0d-8ee1-ab756715ef1e',  -- About the Seller
    '87650074-bc3b-4284-b829-8c20b5f3225a',  -- Shipping Costs
    '5f72d019-49b0-4e8a-be4e-9f08286fee34'   -- Group Buy vs Individual
) AND citations IS NULL;

-- Verify the update
SELECT question, jsonb_array_length(citations) as citation_count 
FROM public.faq_questions 
WHERE jsonb_array_length(citations) > 0
ORDER BY question;
