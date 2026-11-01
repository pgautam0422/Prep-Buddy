import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import briefcaseIcon from '../assets/icons/briefcase.svg';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const sectionRules = [
  { key: 'contact', label: 'Contact details', pattern: /@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\d\s()-]{8,}\d)/i },
  { key: 'summary', label: 'Professional summary', pattern: /\b(summary|objective|profile|about me)\b/i },
  { key: 'experience', label: 'Work experience', pattern: /\b(experience|employment|work history|internship)\b/i },
  { key: 'education', label: 'Education', pattern: /\b(education|academic|degree|bachelor|master|b\.tech|btech)\b/i },
  { key: 'skills', label: 'Skills', pattern: /\b(skills|technologies|technical skills|tools)\b/i },
  { key: 'projects', label: 'Projects', pattern: /\b(projects|portfolio|case studies)\b/i },
  { key: 'certifications', label: 'Certifications', pattern: /\b(certifications?|courses|training)\b/i },
];

const stopWords = new Set(
  'about after again against all also and any are because been before being between both but can could did do does for from had has have how into its may more most not of on only or other our out over should such than that the their them then there these they this through to was were what when where which while who will with would your you'.split(
    ' '
  )
);

const getKeywords = (jobDescription) => {
  const words = jobDescription.toLowerCase().match(/[a-z][a-z+#.-]{2,}/g) || [];
  return [...new Set(words.filter((word) => !stopWords.has(word)))].slice(0, 18);
};

const actionVerbs = ['built', 'created', 'developed', 'designed', 'delivered', 'led', 'improved', 'implemented', 'automated', 'launched', 'optimized', 'analyzed', 'managed'];

const readStoredAnalysis = () => {
  try {
    const storedAnalysis = JSON.parse(sessionStorage.getItem('resumeAnalysis') || 'null');
    if (
      !storedAnalysis ||
      typeof storedAnalysis !== 'object' ||
      typeof storedAnalysis.score !== 'number' ||
      !Array.isArray(storedAnalysis.qualityChecks) ||
      !Array.isArray(storedAnalysis.sections) ||
      !Array.isArray(storedAnalysis.matchedKeywords) ||
      !Array.isArray(storedAnalysis.whatIsWrong) ||
      !Array.isArray(storedAnalysis.whatToChange) ||
      !Array.isArray(storedAnalysis.whatToAdd) ||
      !Array.isArray(storedAnalysis.strengths) ||
      !Array.isArray(storedAnalysis.improvements)
    ) {
      return null;
    }
    return storedAnalysis;
  } catch (error) {
    return null;
  }
};

const analyzeResume = (resumeText, jobDescription) => {
  const text = resumeText.toLowerCase();
  const words = resumeText.trim().split(/\s+/).filter(Boolean);
  const sections = sectionRules.map((section) => ({
    key: section.key,
    label: section.label,
    present: section.pattern.test(resumeText),
  }));
  const keywords = getKeywords(jobDescription);
  const matchedKeywords = keywords.filter((keyword) => text.includes(keyword));
  const missingKeywords = keywords.filter((keyword) => !text.includes(keyword));
  const resumeLines = resumeText.split('\n').map((line) => line.trim()).filter(Boolean);
  const actionVerbCount = resumeLines.filter((line) => actionVerbs.some((verb) => line.toLowerCase().startsWith(verb))).length;
  const quantifiedLineCount = resumeLines.filter((line) => /\b\d+(?:%|\+)|\$\d+|\b(increased|reduced|improved|delivered|saved|grew|led)\b/i.test(line)).length;
  const quantifiedResults = /\b\d+(?:%|\+)|\$\d+|\b(increased|reduced|improved|delivered|saved|grew|led)\b/i.test(resumeText);
  const qualityChecks = [
    { label: 'Contact information', passed: sections.find((section) => section.key === 'contact').present, detail: 'Email and phone are easy to find' },
    { label: 'Readable length', passed: words.length >= 120 && words.length <= 900, detail: `${words.length} words detected` },
    { label: 'Action-led bullets', passed: actionVerbCount >= 2, detail: `${actionVerbCount} action-led lines found` },
    { label: 'Measurable impact', passed: quantifiedLineCount >= 2, detail: `${quantifiedLineCount} quantified lines found` },
    { label: 'Targeted for this role', passed: !jobDescription || matchedKeywords.length >= Math.min(4, keywords.length), detail: jobDescription ? `${matchedKeywords.length} of ${keywords.length} keywords matched` : 'Add a job description to compare' },
  ];
  const missingSections = sections.filter((section) => !section.present && section.key !== 'contact').map((section) => section.label);
  const whatIsWrong = [];
  const whatToChange = [];
  const whatToAdd = [];

  if (!sections.find((section) => section.key === 'contact').present) whatIsWrong.push('Contact information is not easy for an ATS to detect.');
  if (words.length < 120) whatIsWrong.push('The resume has too little searchable evidence for recruiters and screening systems.');
  if (actionVerbCount < 2) whatIsWrong.push('Experience lines do not consistently begin with clear action verbs.');
  if (quantifiedLineCount < 2) whatIsWrong.push('Most achievements do not show measurable results, scope, or impact.');
  if (jobDescription && missingKeywords.length) whatIsWrong.push(`${missingKeywords.length} useful terms from the target role are missing.`);
  if (!whatIsWrong.length) whatIsWrong.push('No major structural issue was detected. Focus on tailoring and evidence quality.');

  if (!sections.find((section) => section.key === 'summary').present) whatToChange.push('Add a focused 2-3 line summary below your name and contact details.');
  if (actionVerbCount < 2) whatToChange.push('Start each experience bullet with a strong verb such as Built, Automated, Led, or Optimized.');
  if (quantifiedLineCount < 2) whatToChange.push('Rewrite responsibilities as action plus result, using numbers, percentages, time saved, or scale.');
  if (jobDescription && missingKeywords.length) whatToChange.push('Use relevant job-description keywords naturally in your skills, projects, and experience sections.');
  whatToChange.push('Use standard headings, simple bullet points, and one consistent date format for ATS readability.');

  if (missingSections.includes('Projects')) whatToAdd.push('Add 1-3 relevant projects with the technology used and your measurable contribution.');
  if (missingSections.includes('Skills')) whatToAdd.push('Add a dedicated technical skills section grouped by languages, frameworks, tools, and databases.');
  if (missingSections.includes('Certifications')) whatToAdd.push('Add relevant certifications, courses, or practical training if they support the target role.');
  if (!jobDescription) whatToAdd.push('Paste a target job description to unlock role-specific keyword recommendations.');
  if (!whatToAdd.length) whatToAdd.push('Add links to your portfolio, GitHub, or LinkedIn if they contain relevant evidence.');
  const score = Math.min(
    100,
    sections.filter((section) => section.present).length * 8 +
      Math.min(20, matchedKeywords.length * 4) +
      (quantifiedResults ? 10 : 0) +
      (words.length >= 250 ? 14 : words.length >= 120 ? 8 : 2)
  );
  const strengths = [];
  const improvements = [];

  if (sections.filter((section) => section.present).length >= 5) strengths.push('Your resume has a clear, recruiter-friendly structure.');
  if (quantifiedResults) strengths.push('You include measurable outcomes, which makes achievements more credible.');
  if (matchedKeywords.length > 0) strengths.push(`${matchedKeywords.length} target keyword${matchedKeywords.length === 1 ? '' : 's'} match the job description.`);
  if (!sections.find((section) => section.key === 'summary').present) improvements.push('Add a 2-3 line summary focused on the role you want.');
  if (!sections.find((section) => section.key === 'projects').present) improvements.push('Add 1-3 relevant projects with your contribution and the technologies used.');
  if (!quantifiedResults) improvements.push('Rewrite experience bullets with numbers, percentages, scale, or clear outcomes.');
  if (jobDescription && matchedKeywords.length < Math.min(5, keywords.length)) improvements.push('Mirror more relevant skills and phrases from the target job description.');
  if (words.length < 120) improvements.push('Add more evidence of your work; the resume currently has very little searchable content.');
  if (!improvements.length) improvements.push('Polish formatting and tailor the first half of the resume to each target role.');

  return {
    score,
    sections,
    matchedKeywords,
    missingKeywords,
    qualityChecks,
    actionVerbCount,
    quantifiedLineCount,
    whatIsWrong,
    whatToChange,
    whatToAdd,
    strengths,
    improvements,
    wordCount: words.length,
    roleMatch: keywords.length ? Math.round((matchedKeywords.length / keywords.length) * 100) : null,
  };
};

const extractPdfText = async (file) => {
  const document = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items
      .filter((item) => 'str' in item && item.str.trim())
      .map((item) => ({
        text: item.str.trim(),
        x: item.transform?.[4] || 0,
        y: item.transform?.[5] || 0,
        width: item.width || 0,
      }))
      .sort((first, second) => second.y - first.y || first.x - second.x);
    const lines = [];

    items.forEach((item) => {
      const currentLine = lines[lines.length - 1];
      if (!currentLine || Math.abs(currentLine.y - item.y) > 4) {
        lines.push({ y: item.y, items: [item] });
      } else {
        currentLine.items.push(item);
      }
    });

    const pageText = lines
      .map((line) =>
        line.items
          .sort((first, second) => first.x - second.x)
          .map((item) => item.text)
          .join(' ')
          .replace(/\s+([,.;:!?])/g, '$1')
      )
      .join('\n');
    pages.push(pageText);
  }

  return pages.join('\n\n').trim();
};

const ResumeAnalyzer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isResultsPage = location.pathname.endsWith('/results');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [analysis, setAnalysis] = useState(() => (isResultsPage ? readStoredAnalysis() : null));

  useEffect(() => {
    if (isResultsPage && !analysis) navigate('/resume-analyzer', { replace: true });
  }, [analysis, isResultsPage, navigate]);

  useEffect(() => () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
  }, [pdfPreviewUrl]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['txt', 'md', 'pdf'].includes(extension)) {
      setPdfPreviewUrl('');
      setResumeText('');
      setFileError('DOCX uploads are not supported in this offline analyzer yet. Paste the resume text below or upload a PDF, TXT, or Markdown file.');
      setFileName(file.name);
      return;
    }
    setFileError('');
    setFileName(file.name);
    if (extension === 'pdf') {
      setResumeText('');
      setPdfPreviewUrl(URL.createObjectURL(file));
      setIsParsing(true);
      try {
        const extractedText = await extractPdfText(file);
        if (!extractedText) {
          setFileError('This PDF does not contain selectable text. It may be scanned or image-based; paste the text manually for analysis.');
          return;
        }
        setResumeText(extractedText);
      } catch (error) {
        setFileError('This PDF could not be read. Try exporting it again or paste its text manually.');
      } finally {
        setIsParsing(false);
      }
      return;
    }
    setPdfPreviewUrl('');
    setResumeText('');
    const reader = new FileReader();
    reader.onload = () => {
      setResumeText(String(reader.result || ''));
      setFileError('');
    };
    reader.onerror = () => setFileError('This file could not be read. Try selecting it again or paste the text manually.');
    reader.readAsText(file);
  };

  const handleAnalyze = (event) => {
    event.preventDefault();
    if (!resumeText.trim()) return;
    const result = analyzeResume(resumeText, jobDescription);
    sessionStorage.setItem('resumeAnalysis', JSON.stringify(result));
    setAnalysis(result);
    navigate('/resume-analyzer/results');
  };

  const handleStartOver = () => {
    sessionStorage.removeItem('resumeAnalysis');
    setAnalysis(null);
    setResumeText('');
    setJobDescription('');
    setFileName('');
    setPdfPreviewUrl('');
    setFileError('');
    navigate('/resume-analyzer');
  };

  const scoreColor = analysis?.score >= 75 ? 'text-emerald-400' : analysis?.score >= 50 ? 'text-amber-400' : 'text-rose-400';

  if (isResultsPage && !analysis) {
    return <div className="min-h-screen bg-[#070914] p-8 text-center text-slate-400">Loading analysis...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="resume-analyzer min-h-screen px-4 py-8 text-white sm:px-8"
      style={{ background: 'radial-gradient(circle at 50% 0%, rgba(37,99,235,0.16), transparent 42%), #070914' }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <img src={briefcaseIcon} alt="Resume analysis" className="h-10 w-10" />
            <h1 className="text-3xl font-black sm:text-5xl">{isResultsPage ? 'Resume Analysis' : 'Resume Analyzer'}</h1>
          </div>
          <p className="text-slate-400">{isResultsPage ? 'Here is what is working, what is missing, and what to improve.' : 'Upload your resume to get a clear ATS readiness report.'}</p>
        </div>

        <div className={isResultsPage ? 'mx-auto max-w-6xl' : 'mx-auto max-w-2xl'}>
          {!isResultsPage ? (
            <>
            <form onSubmit={handleAnalyze} className="glass-card self-start rounded-2xl border border-blue-400/20 p-5 shadow-2xl shadow-blue-950/20 sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">ATS readiness check</p>
                <h2 className="mt-2 text-2xl font-bold">Add your resume</h2>
              </div>
              <label className="cursor-pointer rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300">
                Upload file
                <input type="file" accept=".txt,.md,.pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
            {fileName ? <p className="mb-3 truncate text-xs text-slate-400">Selected: {fileName}</p> : null}
            {isParsing ? <p className="mb-3 rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-3 text-sm text-cyan-200">Reading PDF text...</p> : null}
            {fileError ? <p className="mb-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">{fileError}</p> : null}
            {pdfPreviewUrl ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-200">Uploaded PDF</label>
                  <span className="text-xs text-emerald-300">Text extracted for analysis</span>
                </div>
                <iframe src={pdfPreviewUrl} title="Uploaded resume PDF" className="h-80 w-full rounded-xl border border-slate-600 bg-white" />
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="resume-text">Resume text</label>
                <textarea
                  id="resume-text"
                  value={resumeText}
                  onChange={(event) => setResumeText(event.target.value)}
                  placeholder="Paste your resume text here..."
                  className="h-72 w-full resize-y rounded-xl border border-slate-600 bg-slate-950/70 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>
            )}
            <label className="mb-2 mt-5 block text-sm font-semibold text-slate-200" htmlFor="job-description">Target job description <span className="font-normal text-slate-500">(optional)</span></label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste a job description to compare keywords..."
              className="h-32 w-full resize-y rounded-xl border border-slate-600 bg-slate-950/70 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
            <button
              type="submit"
              disabled={!resumeText.trim() || isParsing}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-950/50 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isParsing ? 'Reading PDF...' : 'Analyze my resume'}
            </button>
            </form>
            </>
          ) : (
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <div className="flex items-center justify-between gap-4 xl:col-span-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Analysis report</p>
                <p className="mt-1 text-sm text-slate-400">Review the findings below and update your resume.</p>
              </div>
              <button type="button" onClick={handleStartOver} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300">Analyze another resume</button>
            </div>
              <>
                <div className="glass-card rounded-2xl border border-slate-700/70 p-6 xl:col-span-2">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-slate-400">ATS readiness score</p><p className={`mt-1 text-5xl font-black ${scoreColor}`}>{analysis.score}<span className="text-xl text-slate-500">/100</span></p></div>
                    <div className="text-right text-sm text-slate-400">{analysis.wordCount} words<br />{analysis.matchedKeywords.length} matched keywords{analysis.roleMatch !== null ? <><br />{analysis.roleMatch}% role match</> : null}</div>
                  </div>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400 transition-all" style={{ width: `${analysis.score}%` }} /></div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 xl:col-span-2">
                  <div className="glass-card rounded-2xl border border-slate-700/70 p-6">
                    <h2 className="mb-4 text-lg font-bold">Recruiter checklist</h2>
                    <div className="space-y-3">
                      {analysis.qualityChecks.map((check) => <div key={check.label} className="flex items-start gap-3"><span className={check.passed ? 'text-emerald-300' : 'text-amber-300'}>{check.passed ? '✓' : '!'}</span><div><p className="text-sm font-semibold text-slate-200">{check.label}</p><p className="text-xs text-slate-500">{check.detail}</p></div></div>)}
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl border border-slate-700/70 p-6">
                    <h2 className="mb-4 text-lg font-bold">Impact signals</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-900/70 p-3"><p className="text-2xl font-black text-cyan-300">{analysis.actionVerbCount}</p><p className="text-xs text-slate-500">action-led lines</p></div>
                      <div className="rounded-lg bg-slate-900/70 p-3"><p className="text-2xl font-black text-emerald-300">{analysis.quantifiedLineCount}</p><p className="text-xs text-slate-500">impact lines</p></div>
                    </div>
                    <p className="mt-4 text-xs leading-5 text-slate-500">Strong bullets show what you changed and the result it created.</p>
                  </div>
                </div>
                <div className="glass-card rounded-2xl border border-slate-700/70 p-6 xl:col-span-2">
                  <h2 className="mb-4 text-lg font-bold">Section coverage</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {analysis.sections.map((section) => <div key={section.key} className={`rounded-lg border p-3 text-sm ${section.present ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-slate-700 bg-slate-900/50 text-slate-500'}`}>{section.present ? '✓' : '○'} {section.label}</div>)}
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 xl:col-span-2">
                  <div className="glass-card rounded-2xl border border-slate-700/70 p-6"><h2 className="mb-3 text-lg font-bold text-emerald-300">What works</h2><ul className="space-y-3 text-sm leading-5 text-slate-300">{analysis.strengths.map((item) => <li key={item}>✓ {item}</li>)}</ul></div>
                  <div className="glass-card rounded-2xl border border-slate-700/70 p-6"><h2 className="mb-3 text-lg font-bold text-amber-300">Improve next</h2><ul className="space-y-3 text-sm leading-5 text-slate-300">{analysis.improvements.map((item) => <li key={item}>→ {item}</li>)}</ul></div>
                </div>
                {analysis.matchedKeywords.length || analysis.missingKeywords.length ? <div className="glass-card rounded-2xl border border-slate-700/70 p-6 xl:col-span-2"><h2 className="mb-3 text-lg font-bold">Keyword alignment</h2><p className="mb-2 text-xs uppercase tracking-wider text-emerald-300">Matched</p><div className="flex flex-wrap gap-2">{analysis.matchedKeywords.map((keyword) => <span key={keyword} className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">{keyword}</span>)}</div>{analysis.missingKeywords.length ? <><p className="mb-2 mt-5 text-xs uppercase tracking-wider text-amber-300">Consider adding</p><div className="flex flex-wrap gap-2">{analysis.missingKeywords.map((keyword) => <span key={keyword} className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">{keyword}</span>)}</div></> : null}</div> : null}
                <div className="glass-card rounded-2xl border border-slate-700/70 p-6 xl:col-span-2">
                  <div className="mb-5"><h2 className="text-xl font-bold">Resume Improvement Plan</h2><p className="mt-1 text-sm text-slate-500">Use these findings to make the resume clearer and more ATS-friendly.</p></div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { title: 'What is wrong', items: analysis.whatIsWrong, color: 'text-rose-300', border: 'border-rose-400/20', background: 'bg-rose-400/5' },
                      { title: 'What to change', items: analysis.whatToChange, color: 'text-amber-300', border: 'border-amber-400/20', background: 'bg-amber-400/5' },
                      { title: 'What to add', items: analysis.whatToAdd, color: 'text-emerald-300', border: 'border-emerald-400/20', background: 'bg-emerald-400/5' },
                    ].map((plan) => (
                      <div key={plan.title} className={`rounded-xl border ${plan.border} ${plan.background} p-4`}>
                        <h3 className={`mb-3 font-bold ${plan.color}`}>{plan.title}</h3>
                        <ul className="space-y-3 text-sm leading-5 text-slate-300">{plan.items.map((item) => <li key={item}>• {item}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                </div>
              </>
          </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ResumeAnalyzer;