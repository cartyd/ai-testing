import React from 'react';
import { Link } from 'react-router-dom';
import { Agent } from 'shared';
import { agentService } from '../services/api';
import { useApi } from '../hooks/useApi';
import './AgentList.css';

const AgentList: React.FC = () => {
  const { data: agents, loading, error, refetch } = useApi(() => agentService.getAgents());

  if (loading) {
    return (
      <div className="agent-list-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading agents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agent-list-container">
        <div className="error">
          <h2>Error Loading Agents</h2>
          <p>{error}</p>
          <button onClick={refetch} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="agent-list-container">
        <div className="empty-state">
          <h2>No Agents Found</h2>
          <p>There are currently no agents available.</p>
          <button onClick={refetch} className="retry-button">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-list-container">
      <header className="agent-list-header">
        <h1>Voice Agents</h1>
        <p>Browse and manage your voice agents</p>
        <button onClick={refetch} className="refresh-button">
          Refresh
        </button>
      </header>

      <div className="agent-grid">
        {/* Deduplicate agents by name, keeping the most recently updated one */}
        {agents
          .reduce((unique: Agent[], agent) => {
            const existingIndex = unique.findIndex(u => u.name === agent.name);
            if (existingIndex >= 0) {
              // Keep the one with the most recent updatedAt timestamp
              if (new Date(agent.updatedAt) > new Date(unique[existingIndex].updatedAt)) {
                unique[existingIndex] = agent;
              }
            } else {
              unique.push(agent);
            }
            return unique;
          }, [])
          .map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
      </div>
    </div>
  );
};

interface AgentCardProps {
  agent: Agent;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <Link to={`/agent/${agent.id}`} className="agent-card">
      <div className="agent-card-header">
        <h3 className="agent-name">{agent.name}</h3>
        <div className="agent-meta">
          <span className="agent-id">ID: {agent.id}</span>
        </div>
      </div>

      <div className="agent-card-body">
        <div className="agent-prompt">
          <p>{truncateText(agent.prompt)}</p>
        </div>

        <div className="agent-details">
          {agent.model && (
            <div className="detail-item">
              <span className="label">Model:</span>
              <span className="value">{agent.model}</span>
            </div>
          )}
          
          {agent.language && (
            <div className="detail-item">
              <span className="label">Language:</span>
              <span className="value">{agent.language}</span>
            </div>
          )}

          {agent.temperature !== undefined && (
            <div className="detail-item">
              <span className="label">Temperature:</span>
              <span className="value">{agent.temperature}</span>
            </div>
          )}

          {agent.voiceId && (
            <div className="detail-item">
              <span className="label">Voice:</span>
              <span className="value">{agent.voiceId}</span>
            </div>
          )}
        </div>
      </div>

      <div className="agent-card-footer">
        <div className="dates">
          <span className="created">Created: {formatDate(agent.createdAt)}</span>
          <span className="updated">Updated: {formatDate(agent.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
};

export default AgentList;