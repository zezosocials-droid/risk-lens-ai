document.addEventListener("DOMContentLoaded", function () {
  const imageInput = document.getElementById('imageInput');
  const textInput = document.getElementById('textInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const loader = document.getElementById('loader');
  const loaderText = document.getElementById('loaderText');
  const statusMessage = document.getElementById('statusMessage');
  const startBtn = document.getElementById('startBtn');
  const demoBtn = document.getElementById('demoBtn');

  const extractedTextEl = document.getElementById('extractedText');
  const sentimentScoreEl = document.getElementById('sentimentScore');
  const hypeLevelEl = document.getElementById('hypeLevel');
  const sentimentNotesEl = document.getElementById('sentimentNotes');
  const momentumContextEl = document.getElementById('momentumContext');
  const bondingStageEl = document.getElementById('bondingStage');
  const bondingExplanationEl = document.getElementById('bondingExplanation');
  const riskSignalsEl = document.getElementById('riskSignals');
  const patternSimilarityEl = document.getElementById('patternSimilarity');

  function scrollToInput() {
    const section = document.getElementById('inputSection');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }

  startBtn?.addEventListener('click', scrollToInput);

  demoBtn?.addEventListener('click', function () {
    const demoText = `Community is hyped about this new meme token launching on a bonding curve. Early holders expect strong energy, 500 holders milestone soon. Team is anonymous but says liquidity will be locked. Claims of 1000x are floating around; utility not yet clear.`;
    if (textInput) textInput.value = demoText;
    scrollToInput();
    runAnalysis();
  });

  analyzeBtn?.addEventListener('click', runAnalysis);

  function showLoader(message) {
    if (loader) loader.hidden = false;
    if (loaderText) loaderText.textContent = message || 'Working...';
  }

  function hideLoader() {
    if (loader) loader.hidden = true;
  }

  function setStatus(message, isError) {
    if (statusMessage) {
      statusMessage.textContent = message || '';
      statusMessage.style.color = isError ? '#f87171' : '#a5f3fc';
    }
  }

  function displayError(message) {
    setStatus(message, true);
    updateUIFromAnalysis({
      cleanedText: '',
      sentimentScore: 0,
      hypeLevel: '-',
      sentimentNotes: 'No analysis could be completed.',
      momentumContext: 'Unavailable due to an error.',
      bondingStage: '-',
      bondingExplanation: 'No stage estimated.',
      riskSignals: ['Unable to analyze risk signals.'],
      patternSimilarity: 'No pattern similarity determined.'
    });
  }

  function runAnalysis() {
    setStatus('');
    const file = imageInput?.files?.[0];
    const manualText = textInput?.value?.trim() || '';

    if (!file && !manualText) {
      setStatus('Please upload an image or paste some text first.', true);
      return;
    }

    if (file) {
      showLoader('Reading image…');
      Tesseract.recognize(file, 'eng', { logger: () => {} })
        .then(({ data }) => {
          hideLoader();
          const ocrText = data?.text || '';
          const combined = `${ocrText}\n${manualText}`.trim();
          proceedAnalysis(combined || manualText);
        })
        .catch(() => {
          hideLoader();
          setStatus('Could not read text from that image, analyzing pasted text if available.', true);
          proceedAnalysis(manualText);
        });
    } else {
      proceedAnalysis(manualText);
    }
  }

  function proceedAnalysis(text) {
    if (!text) {
      displayError('No text available to analyze.');
      return;
    }
    showLoader('Analyzing…');
    try {
      const result = analyzeTokenData(text);
      hideLoader();
      updateUIFromAnalysis(result);
      setStatus('Analysis complete.', false);
    } catch (error) {
      console.error('Analysis error', error);
      hideLoader();
      displayError('Something went wrong during analysis. Please try again.');
    }
  }

  // --- Analysis Engine ---
  // Editable keyword banks
  const hypeWords = ['moon', 'rocket', 'to the moon', '1000x', 'ape', 'next bitcoin', 'pump', 'lambo', 'massive', 'explode'];
  const riskWords = ['anonymous', 'anon team', 'no utility', 'no product', 'guaranteed', 'risk-free', 'renounce later', 'locked soon', 'ape now', 'zero risk', 'don\'t miss'];
  const utilityCues = ['utility', 'product', 'roadmap', 'partnership', 'audit', 'verified', 'liquidity locked'];

  const bondingEarlyKeywords = ['early bonding curve', 'early stage', 'just launched', 'first buyers', 'new listing'];
  const bondingMidKeywords = ['mid curve', 'gaining traction', 'momentum building', 'mid-stage', 'hundreds of holders'];
  const bondingLateKeywords = ['late curve', 'near completion', 'closing soon', 'thousands of holders', 'final stage'];

  function analyzeSentimentAndHype(text) {
    // Adjust sentiment keyword lists here
    const positiveWords = ['strong', 'excited', 'bullish', 'community', 'growth', 'energy', 'momentum'];
    const negativeWords = ['rug', 'scam', 'concern', 'dump', 'fear', 'worry', 'sell'];

    const lower = text.toLowerCase();
    let score = 50;
    let posHits = 0;
    let negHits = 0;

    positiveWords.forEach(word => {
      if (lower.includes(word)) posHits++;
    });
    negativeWords.forEach(word => {
      if (lower.includes(word)) negHits++;
    });

    score += posHits * 8;
    score -= negHits * 12;
    score = Math.max(0, Math.min(100, score));

    const hypeCount = hypeWords.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
    const hypeLevel = hypeCount > 4 ? 'High' : hypeCount > 1 ? 'Medium' : 'Low';
    const sentimentNotes = `Detected ${posHits} positive cues and ${negHits} cautionary cues. Hype terms found: ${hypeCount}.`;

    return { score, hypeLevel, sentimentNotes };
  }

  function analyzeMomentum(text) {
    const lower = text.toLowerCase();
    const hypeCount = hypeWords.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
    const infoDensity = utilityCues.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
    let momentum = 'Neutral';

    if (hypeCount >= 5 && infoDensity <= 1) momentum = 'Strong';
    else if (hypeCount >= 3) momentum = 'Moderate';
    else if (hypeCount === 0 && infoDensity > 0) momentum = 'Weak';

    return `Momentum conditions appear ${momentum.toLowerCase()}. This is contextual only and not predictive.`;
  }

  function estimateBondingCurveStage(text) {
    // Edit bonding cues here
    const lower = text.toLowerCase();
    let stage = 'Mid';
    let explanation = 'No clear bonding-curve cues were found; defaulting to mid-stage educational context.';

    if (bondingEarlyKeywords.some(k => lower.includes(k))) {
      stage = 'Early';
      explanation = 'Early stage cues suggest high volatility and small liquidity pools historically.';
    } else if (bondingLateKeywords.some(k => lower.includes(k))) {
      stage = 'Late';
      explanation = 'Late-stage cues historically correlate with higher entry risk; this is not predictive.';
    } else if (bondingMidKeywords.some(k => lower.includes(k))) {
      stage = 'Mid';
      explanation = 'Mid-curve cues often indicate stabilizing or building interest; not a forecast.';
    }

    return { stage, explanation };
  }

  function detectRiskSignals(text) {
    // Update risk keywords here
    const lower = text.toLowerCase();
    const signals = [];

    riskWords.forEach(word => {
      if (lower.includes(word)) {
        signals.push(`Risk cue detected: "${word}" suggests promotional or speculative language.`);
      }
    });

    if (!lower.match(/utility|product|roadmap/)) {
      signals.push('No clear utility or product description detected; consider verifying real-world purpose.');
    }

    if (lower.includes('anonymous') || lower.includes('anon')) {
      signals.push('Anonymous team mentioned; assess accountability and transparency.');
    }

    return signals.length ? signals : ['No explicit risk phrases spotted, but always research independently.'];
  }

  function analyzePatternSimilarity(text) {
    const lower = text.toLowerCase();
    if (lower.includes('meme') || lower.includes('moon')) {
      return 'Language resembles early high-hype meme-token patterns. This is NOT predictive of performance.';
    }
    if (lower.includes('utility') || lower.includes('product')) {
      return 'Messaging hints at utility-focused tokens with quieter tone. This is contextual only.';
    }
    return 'Description aligns with community-driven hype narratives; educational context only, not a forecast.';
  }

  function analyzeTokenData(inputText) {
    const cleanedText = (inputText || '').trim();
    const { score, hypeLevel, sentimentNotes } = analyzeSentimentAndHype(cleanedText);
    const momentumContext = analyzeMomentum(cleanedText);
    const { stage, explanation } = estimateBondingCurveStage(cleanedText);
    const riskSignals = detectRiskSignals(cleanedText);
    const patternSimilarity = analyzePatternSimilarity(cleanedText);

    return {
      cleanedText,
      sentimentScore: score,
      hypeLevel,
      sentimentNotes,
      momentumContext,
      bondingStage: stage,
      bondingExplanation: explanation,
      riskSignals,
      patternSimilarity
    };
  }

  function updateUIFromAnalysis(result) {
    if (!result) return;
    extractedTextEl && (extractedTextEl.textContent = result.cleanedText || 'No text detected.');
    sentimentScoreEl && (sentimentScoreEl.textContent = result.sentimentScore ?? '-');
    hypeLevelEl && (hypeLevelEl.textContent = result.hypeLevel || '-');
    sentimentNotesEl && (sentimentNotesEl.textContent = `${result.sentimentNotes} This analysis is educational only and NOT financial advice, predictions, or investment recommendations.`);
    momentumContextEl && (momentumContextEl.textContent = `${result.momentumContext} This analysis is educational only and NOT financial advice, predictions, or investment recommendations.`);
    bondingStageEl && (bondingStageEl.textContent = result.bondingStage || '-');
    bondingExplanationEl && (bondingExplanationEl.textContent = `${result.bondingExplanation} This analysis is educational only and NOT financial advice, predictions, or investment recommendations.`);
    patternSimilarityEl && (patternSimilarityEl.textContent = `${result.patternSimilarity} This analysis is educational only and NOT financial advice, predictions, or investment recommendations.`);

    if (riskSignalsEl) {
      riskSignalsEl.innerHTML = '';
      (result.riskSignals || []).forEach(sig => {
        const li = document.createElement('li');
        li.textContent = sig;
        riskSignalsEl.appendChild(li);
      });
      if (!riskSignalsEl.children.length) {
        const li = document.createElement('li');
        li.textContent = 'No risk signals detected; always conduct independent research.';
        riskSignalsEl.appendChild(li);
      }
    }
  }

  // Initialize default research questions for clarity
  const researchQuestions = document.getElementById('researchQuestions');
  if (researchQuestions && researchQuestions.children.length === 0) {
    ['Is liquidity locked?', 'Is the team verifiable?', 'Is there real utility or product?', 'How concentrated are top holders?', 'Are contracts verified and audited?']
      .forEach(q => {
        const li = document.createElement('li');
        li.textContent = q;
        researchQuestions.appendChild(li);
      });
  }

  // Ensure page shows something on load
  setStatus('Ready for analysis. Provide text or upload an image.');
});
