import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const cases = [
  {
    id: "case1",
    title: "Case 01: Acute Symptoms",
    subtitle: "Adaptive Assessment Prototype",
    timeLimitSeconds: 90,
    prompt:
      "A 42-year-old patient reports chest discomfort, dizziness, and shortness of breath.",
    maxClues: 3,
    clues: [
      { id: "vitals", label: "Check vital signs", value: 30, feedback: "Vital signs are essential for identifying urgency." },
      { id: "pain_location", label: "Ask about pain location", value: 25, feedback: "Pain location helps clarify severity." },
      { id: "medications", label: "Ask about current medications", value: 20, feedback: "Medication history can reveal risks." },
      { id: "family_history", label: "Ask about family history", value: 10, feedback: "Family history adds context." }
    ],
    decisions: [
      { id: "escalate", label: "Order immediate evaluation", value: 40, feedback: "Correct escalation." },
      { id: "monitor", label: "Monitor and reassess", value: 15, feedback: "Too passive." }
    ]
  },
  {
    id: "case2",
    title: "Case 02: Mild Symptoms",
    subtitle: "Adaptive Assessment Prototype",
    timeLimitSeconds: 90,
    prompt:
      "A 25-year-old patient reports mild headache and fatigue after a long day.",
    maxClues: 3,
    clues: [
      { id: "sleep", label: "Ask about sleep", value: 25, feedback: "Sleep is highly relevant." },
      { id: "hydration", label: "Ask about hydration", value: 20, feedback: "Hydration impacts fatigue." },
      { id: "stress", label: "Ask about stress levels", value: 20, feedback: "Stress can explain symptoms." },
      { id: "neuro", label: "Perform neurological exam", value: 5, feedback: "Low priority here." }
    ],
    decisions: [
      { id: "rest", label: "Recommend rest", value: 35, feedback: "Appropriate for mild symptoms." },
      { id: "escalate", label: "Order imaging", value: 5, feedback: "Overreaction." }
    ]
  },
  {
    id: "case3",
    title: "Case 03: Ambiguous Symptoms",
    subtitle: "Adaptive Assessment Prototype",
    timeLimitSeconds: 90,
    prompt:
      "A 58-year-old patient reports nausea, sweating, and vague upper abdominal discomfort. The symptoms began one hour ago and are difficult to describe.",
    maxClues: 3,
    clues: [
      { id: "vitals", label: "Check vital signs", value: 28, feedback: "Vital signs help identify instability even when symptoms are vague." },
      { id: "risk", label: "Ask about cardiac risk factors", value: 26, feedback: "Risk factors matter because serious conditions may present atypically." },
      { id: "onset", label: "Clarify onset and progression", value: 22, feedback: "Timing helps separate urgent patterns from minor causes." },
      { id: "diet", label: "Ask about recent meals", value: 8, feedback: "Diet may explain discomfort but should not dominate the assessment." },
      { id: "stress", label: "Ask about stress at work", value: 10, feedback: "Stress is useful context but does not rule out urgent causes." },
      { id: "hydration", label: "Ask about hydration", value: 6, feedback: "Hydration is lower priority for this symptom pattern." }
    ],
    decisions: [
      { id: "urgent_eval", label: "Escalate for urgent evaluation", value: 38, feedback: "Strong choice because vague symptoms can still indicate serious risk." },
      { id: "observe", label: "Observe for 30 minutes", value: 18, feedback: "Observation may delay appropriate evaluation." },
      { id: "antacid", label: "Treat as indigestion", value: 8, feedback: "This assumes a benign cause too early." },
      { id: "discharge", label: "Discharge with lifestyle advice", value: 0, feedback: "This misses the uncertainty and possible risk." }
    ]

  }
];

function App() {
  const [caseIndex, setCaseIndex] = useState(0);
  const caseData = cases[caseIndex];

  const [screen, setScreen] = useState("intro");
  const [selectedClues, setSelectedClues] = useState([]);
  const [decision, setDecision] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(caseData.timeLimitSeconds);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setSecondsLeft(caseData.timeLimitSeconds);
    setSelectedClues([]);
    setDecision(null);
    setScreen("intro");
    setStarted(false);
  }, [caseIndex]);

  useEffect(() => {
    if (!started || screen === "feedback") return;

    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          setScreen("feedback");
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, screen]);

  const score = useMemo(() => {
    const clueScore = selectedClues.reduce((sum, id) => {
      const clue = caseData.clues.find((c) => c.id === id);
      return sum + (clue?.value || 0);
    }, 0);

    const decisionScore =
      caseData.decisions.find((d) => d.id === decision)?.value || 0;

    let total = Math.floor((clueScore * 0.6) + (decisionScore * 0.4));

    if (selectedClues.length < 2) total -= 10;

    return Math.max(0, Math.min(100, total));
  }, [selectedClues, decision, caseData]);

  const missedClues = caseData.clues
    .filter((c) => !selectedClues.includes(c.id))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);

  const revealedInfo = selectedClues.map(id => {
    const clue = caseData.clues.find(c => c.id === id);
    return clue ? clue.label : null;
  });

  function begin() {
    setStarted(true);
    setScreen("gather");
  }

  function toggleClue(id) {
    setSelectedClues((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= caseData.maxClues) return current;
      return [...current, id];
    });
  }

  function reset() {
    setScreen("intro");
    setSelectedClues([]);
    setDecision(null);
    setSecondsLeft(caseData.timeLimitSeconds);
    setStarted(false);
  }

  return (
    <main className="app">
      <section className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{caseData.subtitle}</p>
            <h1>{caseData.title}</h1>
          </div>

          <select
            value={caseIndex}
            onChange={(e) => setCaseIndex(Number(e.target.value))}
          >
            {cases.map((c, i) => (
              <option key={c.id} value={i}>
                {c.title}
              </option>
            ))}
          </select>

          {started && (
            <div className={secondsLeft <= 15 ? "timer danger" : "timer"}>
              {secondsLeft}s
            </div>
          )}
        </header>

        {screen === "intro" && (
          <section className="card">
            <p>{caseData.prompt}</p>
            <button onClick={begin}>Begin</button>
          </section>
        )}

        {screen === "gather" && (
          <section className="card">
            <h2>Gather Info</h2>
            {caseData.clues.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleClue(c.id)}
                className={selectedClues.includes(c.id) ? "choice selected" : "choice"}
              >
                {c.label}
              </button>
            ))}
            <button onClick={() => setScreen("decision")}>Next</button>
          </section>
        )}

        {screen === "decision" && (
          <section className="card">
            <h2>Decision</h2>

            <h3>Information gathered</h3>
            {revealedInfo.map((info, i) => (
              <p key={i} className="feedbackItem">{info}</p>
            ))}
            {caseData.decisions.map((d) => (
              <button
                key={d.id}
                onClick={() => setDecision(d.id)}
                className={decision === d.id ? "choice selected" : "choice"}
              >
                {d.label}
              </button>
            ))}
            <button onClick={() => setScreen("feedback")}>Submit</button>
          </section>
        )}

        {screen === "feedback" && (
          <section className="card">
            <h2>Score: {score}%</h2>

            <h3>Confidence Analysis</h3>
            <p>
              {score >= 80
                ? "Well supported"
                : "Partially supported"}
            </p>

            <h3>Missed Opportunities</h3>
            {missedClues.map((c) => (
              <p key={c.id}>{c.label}</p>
            ))}

            <button onClick={reset}>Try Again</button>
          </section>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
