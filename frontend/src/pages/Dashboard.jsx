import React, { useState, useEffect } from 'react';
import { Activity, Target, Clock, Zap, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function StatCard({ icon, title, value }) {
  return (
    <div className="glass-panel dash-stat-card">
      <div className="dash-stat-icon">
        {icon}
      </div>
      <div>
        <p className="dash-stat-title">{title}</p>
        <h3 className="dash-stat-value">{value}</h3>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ avgScore: 0, totalTaken: 0, practiceHours: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('interviewHistory') || '[]');
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    setHistory(sorted);

    if (sorted.length > 0) {
      const totalScore = sorted.reduce((acc, curr) => acc + curr.scores.overall, 0);
      setStats({
        avgScore: Math.round(totalScore / sorted.length),
        totalTaken: sorted.length,
        practiceHours: +(sorted.length * 0.75).toFixed(1)
      });
    }
  }, []);

  const chartData = (() => {
    const scores = history.slice(0, 7).map(h => h.scores.overall).reverse();
    while (scores.length < 7) scores.unshift(10);
    return scores;
  })();

  return (
    <div className="dash-container">
      <header className="dash-header">
        <div>
          <h1 className="gradient-text dash-title">Welcome back!</h1>
          <p className="dash-subtitle">Here is your interview preparation progress.</p>
        </div>
        <Link to="/interviews" className="btn-primary dash-start-btn">
          <Zap size={20} />
          Start New Interview
        </Link>
      </header>

      <section className="dash-stats-grid">
        <StatCard icon={<Activity color="var(--success)" />} title="Average Score" value={stats.avgScore + '%'} />
        <StatCard icon={<Target color="var(--warning)" />} title="Interviews Taken" value={stats.totalTaken} />
        <StatCard icon={<Clock color="var(--accent-primary)" />} title="Practice Hours" value={stats.practiceHours} />
      </section>

      <section className="dash-content-grid">
        <div className="glass-panel">
          <h2 className="dash-section-title">
            Recent Performance
            <Link to="/history" className="dash-view-link">
              View History <ChevronRight size={16} />
            </Link>
          </h2>

          <div className="dash-chart">
            {chartData.map((score, i) => (
              <div
                key={i}
                className="dash-chart-bar"
                style={{
                  height: score + '%',
                  background: score > 10 ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  opacity: i === chartData.length - 1 ? 1 : 0.6,
                }}
              />
            ))}
          </div>
          <div className="dash-chart-labels">
            <span>Oldest</span><span></span><span></span><span></span><span></span><span></span><span>Latest</span>
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="dash-section-title-sm">Recent Interviews</h2>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No interviews completed yet. Start one to see results here!</p>
          ) : (
            <ul className="dash-interview-list">
              {history.slice(0, 3).map(record => (
                <li
                  key={record.id}
                  className="dash-interview-item"
                  onClick={() => navigate('/interview/result/' + record.id)}
                >
                  <div className="dash-interview-row">
                    <h4 className="dash-interview-domain">{record.domain}</h4>
                    <span className="dash-interview-score" style={{
                      color: record.scores.overall >= 80 ? 'var(--success)' : record.scores.overall >= 60 ? 'var(--warning)' : 'var(--danger)'
                    }}>
                      {record.scores.overall}%
                    </span>
                  </div>
                  <p className="dash-interview-date">
                    {new Date(record.date).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
