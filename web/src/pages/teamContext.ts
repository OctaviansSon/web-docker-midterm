import { useOutletContext } from 'react-router-dom';
import type { TeamDetail } from '../api/types';

export interface TeamContextValue {
  team: TeamDetail;
  reload: () => Promise<void>;
}

export const useTeamContext = () => useOutletContext<TeamContextValue>();
