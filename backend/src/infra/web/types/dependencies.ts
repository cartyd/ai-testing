import type { RetellApiClient } from '../../http/retell-client';
import type { AgentRepository } from '../../../app/ports';

/**
 * Application dependencies interface for dependency injection
 */
export interface AppDependencies {
  retellClient: RetellApiClient;
  agentRepository: AgentRepository;
}

/**
 * Factory function type for creating dependencies
 */
export type DependencyFactory = () => AppDependencies | Promise<AppDependencies>;
