import type { DestinyCharacter } from "../../types/bungie.types"
import { classNames } from "../../types/bungie.types"

interface CharacterPanelProps {
    character: DestinyCharacter
}

export function CharacterPanel({ character }: CharacterPanelProps) {
    return (
        <div>
            <div style={{ backgroundImage: `url(https://www.bungie.net${character.emblemBackgroundPath})` }}></div>
            <p>{classNames[character.classType]}</p>
            <p>Power: {character.light} </p>
        </div>
    )
}