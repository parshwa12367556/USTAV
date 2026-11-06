import { createContext, useMemo, useState, type PropsWithChildren } from 'react';

export type Workspace = { id: string; name: string };
type WorkspaceContextValue = { workspace: Workspace; setWorkspace: (workspace: Workspace) => void };
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const [workspace, setWorkspace] = useState<Workspace>({ id: 'family-demo', name: 'Sharma family' });
  const value = useMemo(() => ({ workspace, setWorkspace }), [workspace]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
