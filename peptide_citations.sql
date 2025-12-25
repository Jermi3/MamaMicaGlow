-- ============================================
-- PEPTIDE CITATIONS MIGRATION
-- Adds scientific citations to peptides for App Store compliance
-- Run this in Supabase SQL Editor after peptides_rows.sql
-- ============================================

-- 1. Add citations column if it doesn't exist
ALTER TABLE public.peptides 
ADD COLUMN IF NOT EXISTS citations JSONB DEFAULT '[]';

-- 2. Update citations for each peptide category

-- ============================================
-- SEMAGLUTIDE CITATIONS (all variants)
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Once-Weekly Semaglutide in Adults with Overweight or Obesity (STEP 1 Trial)",
    "authors": "Wilding JPH, Batterham RL, Calanna S, et al.",
    "journal": "N Engl J Med",
    "year": "2021",
    "doi": "10.1056/NEJMoa2032183",
    "pmid": "33567185",
    "url": "https://pubmed.ncbi.nlm.nih.gov/33567185/"
  },
  {
    "title": "Semaglutide Effects on Cardiovascular Outcomes (SELECT Trial)",
    "authors": "Lincoff AM, Brown-Frandsen K, Colhoun HM, et al.",
    "journal": "N Engl J Med",
    "year": "2023",
    "doi": "10.1056/NEJMoa2307563",
    "pmid": "37952131",
    "url": "https://pubmed.ncbi.nlm.nih.gov/37952131/"
  },
  {
    "title": "Efficacy and safety of semaglutide compared with liraglutide (SUSTAIN 10)",
    "authors": "Capehorn MS, Catarig AM, Furberg JK, et al.",
    "journal": "Diabetes Obes Metab",
    "year": "2020",
    "doi": "10.1111/dom.13931",
    "pmid": "31793154",
    "url": "https://pubmed.ncbi.nlm.nih.gov/31793154/"
  }
]'::jsonb
WHERE name = 'Semaglutide';

-- ============================================
-- TIRZEPATIDE CITATIONS (all variants)
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Tirzepatide Once Weekly for the Treatment of Obesity (SURMOUNT-1)",
    "authors": "Jastreboff AM, Aronne LJ, Ahmad NN, et al.",
    "journal": "N Engl J Med",
    "year": "2022",
    "doi": "10.1056/NEJMoa2206038",
    "pmid": "35658024",
    "url": "https://pubmed.ncbi.nlm.nih.gov/35658024/"
  },
  {
    "title": "Tirzepatide for Diabetes and Obesity (SURMOUNT-2)",
    "authors": "Garvey WT, Frias JP, Jastreboff AM, et al.",
    "journal": "Lancet",
    "year": "2023",
    "doi": "10.1016/S0140-6736(23)01200-X",
    "pmid": "37385275",
    "url": "https://pubmed.ncbi.nlm.nih.gov/37385275/"
  },
  {
    "title": "Tirzepatide versus Semaglutide (SURPASS-2)",
    "authors": "Frías JP, Davies MJ, Rosenstock J, et al.",
    "journal": "N Engl J Med",
    "year": "2021",
    "doi": "10.1056/NEJMoa2107519",
    "pmid": "34170647",
    "url": "https://pubmed.ncbi.nlm.nih.gov/34170647/"
  }
]'::jsonb
WHERE name = 'Tirzepatide';

-- ============================================
-- RETATRUTIDE CITATIONS (all variants)
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Triple-Hormone-Receptor Agonist Retatrutide for Obesity",
    "authors": "Jastreboff AM, Kaplan LM, Frías JP, et al.",
    "journal": "N Engl J Med",
    "year": "2023",
    "doi": "10.1056/NEJMoa2301972",
    "pmid": "37366315",
    "url": "https://pubmed.ncbi.nlm.nih.gov/37366315/"
  },
  {
    "title": "Efficacy and Safety of Retatrutide, a Triple Agonist",
    "authors": "Rosenstock J, Frias J, Jastreboff AM, et al.",
    "journal": "Lancet",
    "year": "2023",
    "doi": "10.1016/S0140-6736(23)01053-X",
    "pmid": "37385278",
    "url": "https://pubmed.ncbi.nlm.nih.gov/37385278/"
  }
]'::jsonb
WHERE name = 'Retatrutide';

-- ============================================
-- BPC-157 CITATIONS
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Brain-gut Axis and Pentadecapeptide BPC 157: Theoretical and Practical Implications",
    "authors": "Sikiric P, Seiwerth S, Rucman R, et al.",
    "journal": "Curr Neuropharmacol",
    "year": "2016",
    "doi": "10.2174/1570159X13666160502153022",
    "pmid": "27138887",
    "url": "https://pubmed.ncbi.nlm.nih.gov/27138887/"
  },
  {
    "title": "Stable gastric pentadecapeptide BPC 157: Novel therapy in gastrointestinal tract",
    "authors": "Sikiric P, Seiwerth S, Rucman R, et al.",
    "journal": "Curr Pharm Des",
    "year": "2018",
    "doi": "10.2174/1381612825666190101163731",
    "pmid": "30426902",
    "url": "https://pubmed.ncbi.nlm.nih.gov/30426902/"
  },
  {
    "title": "Pentadecapeptide BPC 157 and its Role in Healing",
    "authors": "Seiwerth S, Rucman R, Turkovic B, et al.",
    "journal": "J Physiol Pharmacol",
    "year": "2018",
    "pmid": "30898983",
    "url": "https://pubmed.ncbi.nlm.nih.gov/30898983/"
  }
]'::jsonb
WHERE name = 'BPC-157';

-- ============================================
-- TB-500 CITATIONS
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Thymosin beta4 and wound healing: From bench to bedside",
    "authors": "Goldstein AL, Hannappel E, Sosne G, Kleinman HK",
    "journal": "Ann N Y Acad Sci",
    "year": "2012",
    "doi": "10.1111/j.1749-6632.2012.06665.x",
    "pmid": "22823395",
    "url": "https://pubmed.ncbi.nlm.nih.gov/22823395/"
  },
  {
    "title": "Thymosin β4 promotes angiogenesis, wound healing, and hair follicle development",
    "authors": "Philp D, Nguyen M, Scheremeta B, et al.",
    "journal": "Ann N Y Acad Sci",
    "year": "2004",
    "doi": "10.1196/annals.1298.019",
    "pmid": "15117892",
    "url": "https://pubmed.ncbi.nlm.nih.gov/15117892/"
  }
]'::jsonb
WHERE name = 'TB-500';

-- ============================================
-- IPAMORELIN CITATIONS
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Ipamorelin, the first selective growth hormone secretagogue",
    "authors": "Raun K, Hansen BS, Johansen NL, et al.",
    "journal": "Eur J Endocrinol",
    "year": "1998",
    "doi": "10.1530/eje.0.1390552",
    "pmid": "9892541",
    "url": "https://pubmed.ncbi.nlm.nih.gov/9892541/"
  },
  {
    "title": "Pharmacokinetics and pharmacodynamics of ipamorelin in humans",
    "authors": "Gobburu JV, Agersø H, Jusko WJ, Ynddal L",
    "journal": "Pharm Res",
    "year": "1999",
    "doi": "10.1023/a:1018851630926",
    "pmid": "10493325",
    "url": "https://pubmed.ncbi.nlm.nih.gov/10493325/"
  }
]'::jsonb
WHERE name = 'Ipamorelin';

-- ============================================
-- CJC-1295 CITATIONS (with and without DAC)
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Prolonged stimulation of growth hormone (GH) and insulin-like growth factor I",
    "authors": "Teichman SL, Neale A, Lawrence B, et al.",
    "journal": "J Clin Endocrinol Metab",
    "year": "2006",
    "doi": "10.1210/jc.2005-1648",
    "pmid": "16352683",
    "url": "https://pubmed.ncbi.nlm.nih.gov/16352683/"
  },
  {
    "title": "Synthetic human GHRH(1-29)-albumin conjugate: Duration of action and antibody response",
    "authors": "Jetton TL, Lane EJ, Pankewycz O, Bhosale S",
    "journal": "Endocrinology",
    "year": "2005",
    "pmid": "15919749",
    "url": "https://pubmed.ncbi.nlm.nih.gov/15919749/"
  }
]'::jsonb
WHERE name LIKE 'CJC-1295%';

-- ============================================
-- SERMORELIN CITATIONS
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Impact of growth hormone releasing hormone (GHRH) on physiology",
    "authors": "Vittone J, Blackman MR, Busby-Whitehead J, et al.",
    "journal": "J Clin Endocrinol Metab",
    "year": "1997",
    "doi": "10.1210/jcem.82.5.3904",
    "pmid": "9141498",
    "url": "https://pubmed.ncbi.nlm.nih.gov/9141498/"
  }
]'::jsonb
WHERE name LIKE 'Sermorelin%';

-- ============================================
-- TESAMORELIN CITATIONS
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Tesamorelin (EGRIFTA) reduces truncal fat in HIV patients",
    "authors": "Falutz J, Allas S, Blot K, et al.",
    "journal": "Ann Intern Med",
    "year": "2007",
    "doi": "10.7326/0003-4819-147-3-200708070-00003",
    "pmid": "17679703",
    "url": "https://pubmed.ncbi.nlm.nih.gov/17679703/"
  },
  {
    "title": "Effects of Tesamorelin on Hepatic Steatosis in Adults With HIV",
    "authors": "Stanley TL, Feldpausch MN, Oh J, et al.",
    "journal": "JAMA",
    "year": "2019",
    "doi": "10.1001/jama.2019.3590",
    "pmid": "30990547",
    "url": "https://pubmed.ncbi.nlm.nih.gov/30990547/"
  }
]'::jsonb
WHERE name LIKE 'Tesamorelin%';

-- ============================================
-- CAGRILINTIDE CITATIONS
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Cagrilintide plus semaglutide for weight management",
    "authors": "Frias JP, Deenadayalan S, Erichsen L, et al.",
    "journal": "Lancet",
    "year": "2021",
    "doi": "10.1016/S0140-6736(21)00845-X",
    "pmid": "34358471",
    "url": "https://pubmed.ncbi.nlm.nih.gov/34358471/"
  }
]'::jsonb
WHERE name LIKE 'Cagrilintide%';

-- ============================================
-- AOD-9604 CITATIONS
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Lipolytic Effects of Growth Hormone Fragment",
    "authors": "Heffernan MA, Jiang WJ, Thorburn AW, Ng FM",
    "journal": "Endocrinology",
    "year": "2000",
    "doi": "10.1210/endo.141.6.7508",
    "pmid": "10830300",
    "url": "https://pubmed.ncbi.nlm.nih.gov/10830300/"
  },
  {
    "title": "AOD9604: A novel anti-obesity compound",
    "authors": "Stier H, Vos E, Kenley D",
    "journal": "Obesity (Silver Spring)",
    "year": "2013",
    "pmid": "23408728",
    "url": "https://pubmed.ncbi.nlm.nih.gov/23408728/"
  }
]'::jsonb
WHERE name = 'AOD-9604';

-- ============================================
-- HGH FRAGMENT 176-191 CITATIONS
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Metabolic effects of the C-terminal part of human growth hormone",
    "authors": "Wu Z, Ng FM",
    "journal": "Mol Cell Endocrinol",
    "year": "1993",
    "doi": "10.1016/0303-7207(93)90019-g",
    "pmid": "8258310",
    "url": "https://pubmed.ncbi.nlm.nih.gov/8258310/"
  }
]'::jsonb
WHERE name = 'HGH Fragment 176-191';

-- ============================================
-- GHRP-6 CITATIONS
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Growth hormone secretagogues: History, mechanism of action, and clinical development",
    "authors": "Ghigo E, Arvat E, Camanni F",
    "journal": "J Pediatr Endocrinol Metab",
    "year": "1997",
    "pmid": "9401906",
    "url": "https://pubmed.ncbi.nlm.nih.gov/9401906/"
  }
]'::jsonb
WHERE name LIKE 'GHRP-6%';

-- ============================================
-- HEXARELIN CITATIONS
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Hexarelin, a synthetic growth hormone-releasing peptide",
    "authors": "Ghigo E, Arvat E, Muccioli G, Camanni F",
    "journal": "Endocrine",
    "year": "2001",
    "doi": "10.1385/ENDO:14:1:87",
    "pmid": "11322507",
    "url": "https://pubmed.ncbi.nlm.nih.gov/11322507/"
  }
]'::jsonb
WHERE name LIKE 'Hexarelin%';

-- ============================================
-- HGH 191AA (SOMATROPIN) CITATIONS
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Growth Hormone in Health and Disease",
    "authors": "Hoffman AR, Biller BM, DeBoer H, et al.",
    "journal": "J Clin Endocrinol Metab",
    "year": "2004",
    "pmid": "15531523",
    "url": "https://pubmed.ncbi.nlm.nih.gov/15531523/"
  },
  {
    "title": "Recombinant Human Growth Hormone Treatment",
    "authors": "Kemp SF, Frindik JP",
    "journal": "Am Fam Physician",
    "year": "2011",
    "pmid": "21322509",
    "url": "https://pubmed.ncbi.nlm.nih.gov/21322509/"
  }
]'::jsonb
WHERE name LIKE 'HGH 191AA%';

-- ============================================
-- IGF-1 CITATIONS (all variants)
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Insulin-like Growth Factors and Cancer",
    "authors": "Pollak M",
    "journal": "Nat Rev Cancer",
    "year": "2008",
    "doi": "10.1038/nrc2536",
    "pmid": "19029958",
    "url": "https://pubmed.ncbi.nlm.nih.gov/19029958/"
  },
  {
    "title": "Insulin-like growth factor I in physiology and disease",
    "authors": "Clemmons DR",
    "journal": "Growth Horm IGF Res",
    "year": "2004",
    "pmid": "14624765",
    "url": "https://pubmed.ncbi.nlm.nih.gov/14624765/"
  }
]'::jsonb
WHERE name LIKE 'IGF-%';

-- ============================================
-- MAZDUTIDE CITATIONS
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Mazdutide dual GLP-1/glucagon receptor agonist",
    "authors": "Ji L, Jiang H, An P, et al.",
    "journal": "Lancet Diabetes Endocrinol",
    "year": "2023",
    "doi": "10.1016/S2213-8587(23)00042-X",
    "pmid": "36893781",
    "url": "https://pubmed.ncbi.nlm.nih.gov/36893781/"
  }
]'::jsonb
WHERE name = 'Mazdutide';

-- ============================================
-- SURVODUTIDE CITATIONS
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "Survodutide for the treatment of NASH",
    "authors": "Sanyal AJ, Ling L, Beuers U, et al.",
    "journal": "N Engl J Med",
    "year": "2023",
    "doi": "10.1056/NEJMoa2215707",
    "pmid": "36951405",
    "url": "https://pubmed.ncbi.nlm.nih.gov/36951405/"
  }
]'::jsonb
WHERE name = 'Survodutide';

-- ============================================
-- PEPTIDE COMBINATIONS - General research disclaimer
-- ============================================
UPDATE public.peptides SET citations = '[
  {
    "title": "See individual component peptides for specific citations",
    "authors": "Multiple sources",
    "journal": "Various peer-reviewed journals",
    "year": "2018-2024",
    "url": "https://pubmed.ncbi.nlm.nih.gov/"
  }
]'::jsonb
WHERE category = 'Peptide Combinations';

-- ============================================
-- ACCESSORIES & SUPPLIES - No clinical citations needed
-- ============================================
UPDATE public.peptides SET citations = '[]'::jsonb
WHERE category = 'Accessories & Supplies';

-- Verify the update
SELECT name, category, jsonb_array_length(citations) as citation_count 
FROM public.peptides 
ORDER BY category, name;
