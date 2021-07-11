import React, {createContext, useContext, useEffect, useState} from "react";
import {merge} from "lodash"

export interface PlayerData {
  id: number
  vehicleStatus: VehicleStatus;
  distance: number;
  health: number;
  username: string;
  license: string;
}

interface PlayersDataCtx {
  playerCoords: [number, number, number]
  setPlayerCoords: React.Dispatch<React.SetStateAction<[number, number, number]>>
  playerData: PlayerData[]
  playerSortType: PlayerDataSort
  playerFilterInput: string
  sortedAndFilteredPlayerData: PlayerData[]
  setPlayerSortType: React.Dispatch<React.SetStateAction<PlayerDataSort>>
  setPlayerFilterInput: React.Dispatch<React.SetStateAction<string>>
}

export enum PlayerDataSort {
  IdJoinedFirst = "idJoinedFirst",
  IdJoinedLast = "idJoinedLast",
  DistanceClosest = "distanceClosest",
  DistanceFarthest = "distanceFarthest",
}

export enum VehicleStatus {
  Unknown = "unknown",
  Walking = "walking",
  Driving = "driving",
  Flying = "flying", //planes or heli
  Boat = "boating",
  Biking = "biking",
}

const PlayerDataContext = createContext<PlayersDataCtx>(null)

export const usePlayerDataContext = () => useContext<PlayersDataCtx>(PlayerDataContext)

interface PlayerListResponseData {
  h: number,
  ids: string[],
  name: string;
  c: {
    x: number
    y: number
    z: number
  }
  v: string
}
type PlayerListResponse = {
  error: string|null
  ts: number|unknown
  data?: Record<string, PlayerListResponseData> | [];
  diff?: Record<string, Partial<PlayerListResponseData>> | [];
}

const convertPlayerData = (currentCoords: [number,number,number], data: Record<string, PlayerListResponseData>) => {
  const players: PlayerData[] = []
  const [x, y, z] = currentCoords
  for(let [id, playerData] of Object.entries(data)) {
    // TODO: not working
    let distance =
      Math.sqrt(
        Math.abs((playerData.c.x - x) ^ 2) +
        ((playerData.c.y - y) ^ 2) +
        ((playerData.c.z - z) ^ 2)
      )
    // console.log('dist', {id, distance, currentCoords, playerCoords: playerData.c})
    if (isNaN(distance)) distance = 0
    players.push({
      distance,
      id: +id,
      health: playerData.h,
      username: playerData.name,
      license: playerData.ids ? playerData.ids[0] : '',
      vehicleStatus: playerData.v as VehicleStatus
    })
  }
  return players
}

export const PlayerDataProvider: React.FC = ({children}) => {
  const [delay] = useState(5000)
  const [playerCoords, setPlayerCoords] = useState<[number, number, number]>([0, 0, 0])
  const [lastPlayerData, setLastPlayerData] = useState<Record<string, PlayerListResponseData>>({})
  const [playerData, setPlayerData] = useState<PlayerData[]>([])
  const [currentEpoch, setCurrentEpoch] = useState<number|null>(null)
  const [playerSortType, setPlayerSortType] = useState(PlayerDataSort.IdJoinedFirst)
  const [playerFilterInput, setPlayerFilterInput] = useState("")
  const [sortedAndFilteredPlayerData, setSortedAndFilteredPlayerData] = useState<PlayerData[]>([])

  useEffect(() => {
    console.log(`Starting player list interval (every ${delay}ms)`)
    const interval = setInterval(() => {
      //Performing http request
      fetch('http://localhost:30120/monitor/players.json', {
        headers: {
          // FIXME: set me
          'x-txadmin-token': 'xxxx_Debug_Token_xxx',
          'x-txadmin-epoch': currentEpoch ? currentEpoch.toString() : null,
        },
      }).then(r => r.json() as Promise<PlayerListResponse>).then(json => {
        //Validating response
        if(typeof json.error == 'string') throw new Error(`API Error: ${json.error}`);
        if(typeof json.ts != 'number') throw new Error(`Invalid response scheme`);
        if(json.ts < currentEpoch) throw new Error('Out-of-order reply');

        setPlayerCoords(playerCoords => {
          if (typeof json.data === 'object' && json.data !== null) {
            //If Epoch
            if (Array.isArray(json.data)) json.data = {};
            setCurrentEpoch(json.ts as number)
            setLastPlayerData(json.data)
            setPlayerData(convertPlayerData(playerCoords, json.data))
          } else if (typeof json.diff === 'object' && json.diff !== null) {
            //If Epoch Diff
            if (!currentEpoch) throw new Error('Expected epoch, got diff');
            if (Array.isArray(json.diff)) json.diff = {};
            setCurrentEpoch(json.ts as number)
            const mergedData = merge(lastPlayerData, json.diff) as Record<string, PlayerListResponseData>
            setLastPlayerData(mergedData)
            setPlayerData(convertPlayerData(playerCoords, mergedData))
          } else {
            //If unknown
            throw new Error(`Expected data or diff, got neither`);
          }
          return playerCoords
        })
      });

    }, delay)
    return () => clearInterval(interval)
  }, [delay, setPlayerCoords, setCurrentEpoch, setPlayerData, setLastPlayerData])

  useEffect(() => {
    const sortedAndFilteredPlayers = (() => {
      const filteredValueInput = playerFilterInput
      const unfilteredPlayerStates = playerData
      const formattedInput = filteredValueInput.trim().toLowerCase();

      const playerStates: PlayerData[] = filteredValueInput
        ? unfilteredPlayerStates.filter(
          (player) =>
            player.username.toLowerCase().includes(formattedInput) ||
            player.id.toString().includes(formattedInput)
        )
        : unfilteredPlayerStates;

      switch (playerSortType) {
        case PlayerDataSort.DistanceClosest:
          return [...playerStates].sort((a, b) =>
            a.distance > b.distance ? 1 : -1
          );
        case PlayerDataSort.DistanceFarthest:
          return [...playerStates].sort((a, b) =>
            a.distance < b.distance ? 1 : -1
          );
        case PlayerDataSort.IdJoinedFirst:
          return [...playerStates].sort((a, b) => (a.id > b.id ? 1 : -1));
        case PlayerDataSort.IdJoinedLast:
          return [...playerStates].sort((a, b) => (a.id < b.id ? 1 : -1));
        default:
          return playerStates;
      }
    })()

    setSortedAndFilteredPlayerData(sortedAndFilteredPlayers)
  }, [setSortedAndFilteredPlayerData, playerData, playerSortType, playerFilterInput])

  return <PlayerDataContext.Provider value={{
    playerData,
    playerSortType,
    setPlayerSortType,
    playerFilterInput,
    setPlayerFilterInput,
    sortedAndFilteredPlayerData,
    playerCoords,
    setPlayerCoords,
  }}>
    {children}
  </PlayerDataContext.Provider>
}
