import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const db = new Database('database.sqlite');

app.use(cors());
app.use(express.json());

// Initialisation des tables
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    knowledge_base TEXT NOT NULL,
    response_scope TEXT NOT NULL,
    api_key TEXT NOT NULL,
    integrations TEXT NOT NULL,
    widget_config TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (agent_id) REFERENCES agents (id)
  );

  CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    total_messages INTEGER NOT NULL,
    active_users INTEGER NOT NULL,
    response_rate REAL NOT NULL,
    avg_response_time REAL NOT NULL,
    satisfaction_rate REAL NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (agent_id) REFERENCES agents (id)
  );
`);

// Routes pour les agents
app.get('/api/agents', (req, res) => {
  const agents = db.prepare('SELECT * FROM agents ORDER BY created_at DESC').all();
  res.json(agents);
});

app.post('/api/agents', (req, res) => {
  const agent = req.body;
  const stmt = db.prepare(`
    INSERT INTO agents (id, name, description, knowledge_base, response_scope, api_key, integrations, widget_config, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    agent.id,
    agent.name,
    agent.description,
    agent.knowledge_base,
    agent.response_scope,
    agent.api_key,
    agent.integrations,
    agent.widget_config,
    agent.created_at,
    agent.updated_at
  );
  
  res.json(agent);
});

// Routes pour les analytics
app.get('/api/analytics/:agentId', (req, res) => {
  const { agentId } = req.params;
  const { startDate, endDate } = req.query;
  
  const analytics = db.prepare(`
    SELECT * FROM analytics 
    WHERE agent_id = ? AND date BETWEEN ? AND ?
    ORDER BY date DESC
  `).all(agentId, startDate, endDate);
  
  res.json(analytics);
});

app.get('/api/analytics/global', (req, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(DISTINCT id) as activeAgents,
      SUM(total_messages) as totalMessages,
      AVG(satisfaction_rate) as avgSatisfactionRate
    FROM agents a
    LEFT JOIN analytics an ON a.id = an.agent_id
    WHERE an.date = DATE('now')
  `).get();
  
  res.json(stats);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});