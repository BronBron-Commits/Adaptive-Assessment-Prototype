import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const caseData = {
  title: "Case 01: Acute Symptoms",
  subtitle: "Adaptive Assessment Prototype",
  timeLimitSeconds: 90,
  prompt:
    "A 42-year-old patient reports chest discomfort, dizziness, and shortness of breath. Gather information, make a decision, and review your reasoning.",
  maxClues: 3,
  clues: [
    {
      id: "vitals",
      label: "Check vital signs",
      value: 30,
      feedback: "Vital signs are essential for identifying urgency."
    },
    {
      id: "pain_location",
      label: "Ask about pain location",
      value: 25,
      feedback: "Pain location helps clarify severity and possible causes."
    },
    {
      id: "medications",
      label: "Ask about current medications",
      value: 20,
      feedback: "Medication history can reveal risks or interactions."
    },
    {
      id: "recent_meals",
      label: "Ask about recent meals",
      value: 5,
      feedback: "Recent meals may be relevant, but it is lower priority here."
    },
    {
      id: "family_history",
      label: "Ask about family history",
      value: 10,
      feedback: "Family history adds context but is not the most urgent first step."
    },
    {
      id: "neuro_exam",
      label: "Perform neurological exam",
      value: 10,
      feedback: "A neurological exam may matter, but other information is higher priority first."
    }
  ],
  decisions: [
    {
      id: "escalate",
      label: "Order immediate evaluation",
      value: 40,
      feedback: "Appropriate escalation based on the symptom pattern."
    },
    {
      id: "monitor",
      label: "Monitor and reassess later",
      value: 15,
      feedback: "Monitoring alone may delay needed evaluation."
    },
    {
      id: "rest",
      label: "Recommend rest and hydration",
      value: 5,
      feedback: "This underestimates the seriousness of the presentation."
    },
    {
      id: "discharge",
      label: "Discharge with instructions",
      value: 0,
      feedback: "This is premature based on the symptoms."
    }
  ]
};

function App() {
  const [screen, setScreen] = useState("intro");
  const [selectedClues, setSelectedClues] = useState([]);
  const [decision, setDecision] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(caseData.timeLimitSeconds);
  const [started, setStarted] = useState(false);

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

    if (selectedClues.length < 2) {
      total -= 10;
    }

    return Math.max(0, Math.min(100, total));
  }, [selectedClues, decision]);

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

  const missedClues = caseData.clues
    .filter((clue) => !selectedClues.includes(clue.id))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);

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

          {started && (
            <div className={secondsLeft <= 15 ? "timer danger" : "timer"}>
              {secondsLeft}s
            </div>
          )}
        </header>

        {screen === "intro" && (
          <section className="card hero">
            <h2>Interactive decision-making prototype</h2>
            <p>{caseData.prompt}</p>
            <div className="meta">
              <span>{caseData.timeLimitSeconds}s timer</span>
              <span>Choose up to {caseData.maxClues} clues</span>
              <span>Rule-based scoring</span>
            </div>
            <button onClick={begin}>Begin Assessment</button>
          </section>
        )}

        {screen === "gather" && (
          <section className="card">
            <div className="sectionHeader">
              <div>
                <h2>Gather information</h2>
                <p>Select up to {caseData.maxClues} information-gathering actions.</p>
              </div>
              <strong>
                {selectedClues.length}/{caseData.maxClues}
              </strong>
            </div>

            <div className="grid">
              {caseData.clues.map((clue) => (
                <button
                  key={clue.id}
                  className={
                    selectedClues.includes(clue.id)
                      ? "choice selected"
                      : "choice"
                  }
                  onClick={() => toggleClue(clue.id)}
                >
                  <span>{clue.label}</span>
                  <small>{clue.value} pts</small>
                </button>
              ))}
            </div>

            <div className="actions">
              <button
                disabled={selectedClues.length === 0}
                onClick={() => setScreen("decision")}
              >
                Continue to Decision
              </button>
            </div>
          </section>
        )}

        {screen === "decision" && (
          <section className="card">
            <h2>Choose next best step</h2>
            <p>Your selected information will affect the quality score.</p>

            <div className="stack">
              {caseData.decisions.map((item) => (
                <button
                  key={item.id}
                  className={decision === item.id ? "choice selected" : "choice"}
                  onClick={() => setDecision(item.id)}
                >
                  <span>{item.label}</span>
                  <small>{item.value} pts</small>
                </button>
              ))}
            </div>

            <div className="actions">
              <button onClick={() => setScreen("gather")} className="secondary">
                Back
              </button>
              <button
                disabled={!decision}
                onClick={() => setScreen("feedback")}
              >
                Submit
              </button>
            </div>
          </section>
        )}

        {screen === "feedback" && (
          <section className="card">
            <h2>Feedback</h2>

            <div className="scoreBox">
              <span>Decision Quality</span>
              <strong>{score}%</strong>
            </div>

            <div className="feedbackGrid">
              <div>
                <h3>Selected information</h3>
                {selectedClues.length ? (
                  selectedClues.map((id) => {
                    const clue = caseData.clues.find((c) => c.id === id);
                    return (
                      <p key={id} className="feedbackItem">
                        <b>{clue.label}</b>
                        <br />
                        {clue.feedback}
                      </p>
                    );
                  })
                ) : (
                  <p className="feedbackItem">No information selected.</p>
                )}
              </div>

              <div>
                <h3>Decision</h3>
                {decision ? (
                  <p className="feedbackItem">
                    <b>{caseData.decisions.find((d) => d.id === decision).label}</b>
                    <br />
                    {caseData.decisions.find((d) => d.id === decision).feedback}
                  </p>
                ) : (
                  <p className="feedbackItem">
                    Time expired before a final decision was submitted.
                  </p>
                )}

                <h3>Confidence Analysis</h3>
                <p className="feedbackItem">
                  Your decision was {score >= 80 ? "well-supported" : "partially supported"} by the information gathered.
                </p>

                <h3>Missed Opportunities</h3>
                {missedClues.map((clue) => (
                  <p key={clue.id} className="feedbackItem">
                    <b>{clue.label}</b>
                    <br />
                    {clue.feedback}
                  </p>
                ))}
              </div>
            </div>

            <div className="actions">
              <button onClick={reset}>Try Again</button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
