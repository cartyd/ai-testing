import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Agent, AgentPrompt } from 'shared';
import { agentService } from '../services/api';
import { useAsyncOperation } from '../hooks/useApi';
import './AgentDetail.css';

const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [agentPrompt, setAgentPrompt] = useState<AgentPrompt | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'prompt'>('details');
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  
  const { loading: agentLoading, error: agentError, execute: fetchAgentRaw } = useAsyncOperation<Agent>();
  const { loading: promptLoading, error: promptError, execute: fetchPromptRaw } = useAsyncOperation<AgentPrompt>();

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        // Load agent details
        const agentData = await fetchAgentRaw(() => agentService.getAgent(id));
        setAgent(agentData);

        // Load agent prompt
        const promptData = await fetchPromptRaw(() => agentService.getAgentPrompt(id));
        setAgentPrompt(promptData);
      } catch (error) {
        console.error('Failed to load agent data:', error);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const isLoading = agentLoading || promptLoading;
  const hasError = agentError || promptError;

  if (isLoading) {
    return (
      <div className="agent-detail-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading agent details...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="agent-detail-container">
        <div className="error">
          <h2>Error Loading Agent</h2>
          <p>{agentError || promptError}</p>
          <div className="error-actions">
            <button onClick={() => window.location.reload()} className="retry-button">
              Try Again
            </button>
            <Link to="/" className="back-link">
              Back to Agents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="agent-detail-container">
        <div className="empty-state">
          <h2>Agent Not Found</h2>
          <p>The requested agent could not be found.</p>
          <Link to="/" className="back-link">
            Back to Agents
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="agent-detail-container">
      <header className="agent-detail-header">
        <nav className="breadcrumb">
          <Link to="/">← Back to Agents</Link>
        </nav>
        
        <div className="agent-title">
          <h1>{agent.name}</h1>
          <span className="agent-id">ID: {agent.id}</span>
        </div>

        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`tab-button ${activeTab === 'prompt' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompt')}
          >
            Prompt
          </button>
        </div>
      </header>

      <div className="agent-detail-content">
        {activeTab === 'details' && (
          <div className="details-tab">
            <div className="details-grid">
              <div className="detail-section">
                <h3>Configuration</h3>
                <div className="detail-items">
                  <div className="detail-item">
                    <span className="label">Model:</span>
                    <span className="value">{agent.model || 'Not specified'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="label">Language:</span>
                    <span className="value">{agent.language || 'Not specified'}</span>
                  </div>

                  <div className="detail-item">
                    <span className="label">Voice ID:</span>
                    <span className="value">{agent.voiceId || 'Not specified'}</span>
                  </div>

                  <div className="detail-item">
                    <span className="label">Temperature:</span>
                    <span className="value">{agent.temperature ?? 'Not specified'}</span>
                  </div>

                  <div className="detail-item">
                    <span className="label">Max Tokens:</span>
                    <span className="value">{agent.maxTokens ?? 'Not specified'}</span>
                  </div>

                  {agent.version && (
                    <div className="detail-item">
                      <span className="label">Version:</span>
                      <span className="value">
                        {agent.version}
                        {agent.versionTitle && ` (${agent.versionTitle})`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Timestamps</h3>
                <div className="detail-items">
                  <div className="detail-item">
                    <span className="label">Created:</span>
                    <span className="value">{formatDate(agent.createdAt)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="label">Last Updated:</span>
                    <span className="value">{formatDate(agent.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="prompt-preview">
              <h3>Prompt Preview</h3>
              <div className="prompt-preview-text">
                {agent.prompt.length > 200 
                  ? `${agent.prompt.substring(0, 200)}...` 
                  : agent.prompt
                }
              </div>
              <p className="prompt-preview-note">
                Click the "Prompt" tab to view the full prompt and additional details.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'prompt' && (
          <div className="prompt-tab">
            {agentPrompt ? (
              <>
                <div className="prompt-header">
                  <h3>System Prompt</h3>
                  <div className="prompt-meta">
                    {agentPrompt.version && (
                      <span className="prompt-version">Version: {agentPrompt.version}</span>
                    )}
                    <span className="prompt-updated">
                      Last Updated: {formatDate(agentPrompt.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="version-selector">
                  <label htmlFor="version-select">Prompt Version:</label>
                  <select 
                    id="version-select" 
                    className="version-select"
                    value={selectedVersion || agentPrompt.version || 1}
                    onChange={(e) => setSelectedVersion(Number(e.target.value))}
                  >
                    <option value={agentPrompt.version || 1}>
                      Version {agentPrompt.version || 1}
                      {agentPrompt.versionTitle ? ` - ${agentPrompt.versionTitle}` : ' (Current)'}
                    </option>
                  </select>
                  <span className="version-note">
                    {agentPrompt.versionTitle 
                      ? `Currently viewing: ${agentPrompt.versionTitle}` 
                      : 'Showing current version'}
                  </span>
                </div>

                <div className="prompt-content">
                  <pre className="prompt-text">{agentPrompt.prompt}</pre>
                </div>

                <div className="prompt-actions">
                  <button 
                    className="copy-button"
                    onClick={() => {
                      navigator.clipboard.writeText(agentPrompt.prompt);
                      // You could add a toast notification here
                      alert('Prompt copied to clipboard!');
                    }}
                  >
                    Copy Prompt
                  </button>
                </div>
              </>
            ) : (
              <div className="prompt-loading">
                <p>Prompt information is not available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDetail;