import {useSetIsMenuVisible} from "../state/visibility.state";
import {txAdminMenuPage, useSetPage} from "../state/page.state";
import {useNuiEvent} from "./useNuiEvent";
import {PermCheckServerResp, useSetPermissions,} from "../state/permissions.state";
import {fetchNuiAuth} from "../utils/fetchNuiAuth";
import {usePlayerDataContext} from "../provider/PlayerDataProvider";

// Passive Message Event Listeners & Handlers for global state
export const useNuiListenerService = () => {
  const setVisible = useSetIsMenuVisible();
  const setMenuPage = useSetPage();
  const setPermsState = useSetPermissions();
  const {setPlayerCoords} = usePlayerDataContext()

  useNuiEvent<boolean>("setDebugMode", (debugMode) => {
    (window as any).__MenuDebugMode = debugMode;
  });
  useNuiEvent<boolean>("setVisible", setVisible);
  useNuiEvent<txAdminMenuPage>("setMenuPage", setMenuPage);
  useNuiEvent("setPlayerCoords", (data: [number, number, number]) => {
    const [x, y, z] = data;
    setPlayerCoords([x, y, z])
  })
  useNuiEvent<PermCheckServerResp>("reAuth", () => {
    fetchNuiAuth().then(setPermsState);
  });
};
