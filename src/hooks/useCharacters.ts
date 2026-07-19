import { useEffect } from "react";
import { bungieGet } from "../services/bungieApi";
import { useAuthStore } from "../store/authStore";
import { useCharacterStore } from "../store/characterStore";
import type {
  DestinyProfileResponse,
  MembershipType,
} from "../types/bungie.types";

export function useCharacters() {
  const membershipId = useAuthStore((state) => state.membershipId);
  const {
    setCharacters,
    setLoading,
    setError,
    setMembershipType,
    setDestinyMembershipId,
  } = useCharacterStore();

  useEffect(() => {
    if (!membershipId) return;
    setLoading(true);

    bungieGet<MembershipType>(`/User/GetMembershipsById/${membershipId}/254/`)
      .then((response) => {
        const membershipType =
          response.Response.destinyMemberships[0].membershipType;
        setMembershipType(membershipType);

        const destinyMembershipId =
          response.Response.destinyMemberships[0].membershipId;
        setDestinyMembershipId(destinyMembershipId);

        return bungieGet<DestinyProfileResponse>(
          `/Destiny2/${membershipType}/Profile/${destinyMembershipId}/?components=200`,
        );
      })
      .then((response) => {
        setCharacters(response.Response.characters.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching character data for store");
        setLoading(false);
      });
  }, [
    membershipId,
    setCharacters,
    setLoading,
    setError,
    setMembershipType,
    setDestinyMembershipId,
  ]);
}
